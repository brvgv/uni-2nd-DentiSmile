/* eslint-disable @typescript-eslint/no-explicit-any */
export enum RequestType {
    BROADCAST = 'broadcast',
    DIRECT = 'direct'
}

interface RequestResponse<T> {
    resolve: (value: T) => void
    reject: (error: Error) => void
    timeout?: NodeJS.Timeout
    type: RequestType
}

export class RequestResponseManager<T> {
    private requests = new Map<string, RequestResponse<T>>()
    private DEFAULT_TIMEOUT = 10000
    private broadcastSubscriptions = new Set<string>()

    public async request(
        requestTopic: string,
        responseTopic: string,
        payload: any,
        client: any,
        type: RequestType = RequestType.DIRECT,
        timeout = this.DEFAULT_TIMEOUT
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const clientId = this.generateUniqueId()
            const requestPayload = { ...payload, clientId }

            const timeoutHandler =
                type === RequestType.DIRECT
                    ? setTimeout(() => {
                        this.cleanup(clientId, client)
                        reject(new Error('Request timed out'))
                    }, timeout)
                    : undefined

            // Store request details
            this.requests.set(clientId, {
                resolve,
                reject,
                timeout: timeoutHandler,
                type
            })

            console.log('Response Topic', responseTopic);

            // Handle subscription based on type
            const topicToSubscribe =
                type === RequestType.BROADCAST
                    ? responseTopic
                    : responseTopic + clientId
            console.log('Topic', topicToSubscribe);

            if (
                type === RequestType.BROADCAST &&
                this.broadcastSubscriptions.has(topicToSubscribe)
            ) {
                // Already subscribed to broadcast topic
                client.publish(requestTopic, JSON.stringify(requestPayload))
                return
            }

            client.subscribe(topicToSubscribe, (err: Error) => {
                if (err) {
                    this.cleanup(clientId, client)
                    reject(new Error(`Subscription error: ${err.message}`))
                    return
                }

                console.log('Subscribed to topic', topicToSubscribe);

                if (type === RequestType.BROADCAST) {
                    this.broadcastSubscriptions.add(topicToSubscribe)
                }

                // Publish request
                client.publish(requestTopic, JSON.stringify(requestPayload))
                console.log('Publishing to topic', requestTopic, 'with', requestPayload);
            })

            // Setup message handler
            const messageHandler = (topic: string, message: Buffer) => {
                console.log('message received on topic', topic, 'message:', message.toString())
                try {
                    const response = JSON.parse(message.toString())

                    if (topic === topicToSubscribe) {
                        this.handleResponse(clientId, response, client, type)
                    }
                } catch (error) {
                    if (type === RequestType.DIRECT) {
                        this.cleanup(clientId, client)
                        reject(new Error('Invalid response format', error))
                    }
                }
            }

            client.on('message', messageHandler)
        })
    }

    private handleResponse(
        clientId: string,
        response: any,
        client: any,
        type: RequestType
    ) {
        const request = this.requests.get(clientId)
        if (request) {
            if (type === RequestType.DIRECT) {
                clearTimeout(request.timeout)
                if (response.status?.code === 200) {
                    // removed .data
                    request.resolve(response)
                } else {
                    request.reject(
                        new Error(response.error || 'Request failed')
                    )
                }
                this.cleanup(clientId, client)
            } else {
                // For broadcast, just resolve with data and keep subscription
                request.resolve(response.data)
            }
        }
    }

    private cleanup(clientId: string, client: any) {
        const request = this.requests.get(clientId)
        if (request) {
            if (request.type === RequestType.DIRECT) {
                clearTimeout(request.timeout)
                client.unsubscribe(clientId)
            }
            this.requests.delete(clientId)
        }
    }

    public unsubscribeAll(client: any) {
        // Clean up all subscriptions when component unmounts
        this.broadcastSubscriptions.forEach((topic) => {
            client.unsubscribe(topic)
        })
        this.broadcastSubscriptions.clear()
    }

    private generateUniqueId(): string {
        return Math.random().toString(36).slice(2, 9)
    }
}
