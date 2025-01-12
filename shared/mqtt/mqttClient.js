import mqtt from 'mqtt'

let client = null

export const connectMQTT = async (MQTT_URI, options = {}) => {
    if (client) {
        return client
    }
    try {
        client = await mqtt.connectAsync(MQTT_URI, options)

        console.log(`Connected to MQTT Broker at ${MQTT_URI}`)

        client.on('error', (err) => {
            console.error('MQTT connection error:', err)
            client.end()
        })

        client.on('reconnect', () => {
            console.log('Reconnecting to MQTT Broker...')
        })

        client.on('offline', () => {
            console.log('MQTT Client is offline')
        })
        return client
    } catch (error) {
        console.error('Error connecting MQTT', error)
        throw error
    }
}

export const publish = async (topic, message, options = {}) => {
    if (!client) {
        throw new Error('MQTT client not connected')
    }
    try {
        await client.publishAsync(topic, JSON.stringify(message), options)
        console.log(`Message published to topic "${topic}": ${message}`)
    } catch (error) {
        console.error(`Error publishing to topic "${topic}":`, error)
        throw error
    }
}

export const subscribe = async (topic, callback, options = {}) => {
    if (!client) {
        throw new Error('MQTT client not connected')
    }
    try {
        await client.subscribeAsync(topic, options)
        console.log(`Subscribed to topic "${topic}"`)

        client.on('message', (receivedTopic, message) => {
            if (receivedTopic === topic) {
                callback(JSON.parse(message.toString()));
            }
        })
    } catch (error) {
        console.error(`Error subscribing to topic "${topic}":`, error)
        throw error
    }
}

export const unsubscribe = async (topic) => {
    if (!client) {
        throw new Error('MQTT client not connected')
    }
    try {
        await client.unsubscribeAsync(topic)
        console.log(`Unsubscribed from topic "${topic}"`)
    } catch (error) {
        console.error(`Error unsubscribing from topic "${topic}":`, error)
        throw error
    }
}

export const disconnectMQTT = async (options = {}) => {
    try {
        await client.endAsync(options)
        console.log('MQTT client disconnected')
    } catch (error) {
        console.error('Error disconnecting MQTT client:', error)
        throw error
    }
}

export const handleEndpoint = async (
    requestTopic,
    callback,
    responseTopic,
    options = {}
) => {
    if (!client) {
        throw new Error('MQTT client not connected')
    }
    try {
        await client.subscribeAsync(requestTopic, options)
        console.log(`Subscribed to topic "${requestTopic}"`)

        client.on('message', async (receivedTopic, message) => {
            if (receivedTopic === requestTopic) {
                let parsedMessage;
                try {
                    parsedMessage = JSON.parse(message.toString());
                } catch (parseError) {
                    console.error(`Invalid JSON payload received: ${message.toString()}`, parseError);
                    return;
                }

                const { clientId } = parsedMessage;
                const dynamicResponseTopic = responseTopic(clientId)
                const response = await callback(message.toString())
                await publish(dynamicResponseTopic, response, options)
            }
        })
    } catch (error) {
        console.error(`Error subscribing to topic "${requestTopic}":`, error)
        throw error
    }
}

export const validateEntity = async ({
    requestTopic,
    responseTopicGenerator,
    payload,
    validateResponse,
    timeoutDuration = 5000
}) => {
    const clientId = Math.random().toString(36).slice(2, 9);
    const updatedPayload = { ...payload, clientId };
    const responseTopic = responseTopicGenerator(clientId);

    return new Promise(async (resolve, reject) => {
        let timeout;

        try {
            await subscribe(responseTopic, async (response) => {
                clearTimeout(timeout);

                await unsubscribe(responseTopic);

                const isValid = await validateResponse(response, updatedPayload);
                resolve(isValid);
            });

            await publish(requestTopic, updatedPayload);

            timeout = setTimeout(async () => {
                await unsubscribe(responseTopic);
                resolve(false);
            }, timeoutDuration);
        } catch (error) {
            console.error('Error validating the entity:', error);
            reject(false);
        }
    });
};