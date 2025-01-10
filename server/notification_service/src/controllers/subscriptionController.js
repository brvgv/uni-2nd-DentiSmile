import DateSubscription from "../models/dateSubscription.js"
import { MQTT_TOPICS } from "shared-mqtt/mqttTopics.js";
import { publish, subscribe, unsubscribe } from "shared-mqtt/mqttClient.js";
import { generateUniqueId } from "../utils/notificationUtils.js";

export const subscribeToDate = async (message) => {
    try {
        const { clinicId, patientId, date } = JSON.parse(message);

        const timestamp = new Date(date).toISOString().split('T')[0];

        const clinicExists = await validateClinic(clinicId);
        if (!clinicExists) {
            return {
                status: { code: 400, message: `Clinic not found` },
                data: existingSubscription
            };
        }

        // TO-DO: authorization
        const existingSubscription = await DateSubscription.findOne({ clinicId, date: timestamp });

        if (existingSubscription) {
            if (existingSubscription.patientId.includes(patientId)) {
                return {
                    status: { code: 400, message: `A subscription for this patient already exists for this clinic` },
                    data: existingSubscription
                };
            }

            // If no conflicting patients found, append new one
            existingSubscription.patientId.push(patientId);
            await existingSubscription.save();
            return {
                status: { code: 200, message: 'Patients added to the existing subscription successfully' },
                data: existingSubscription
            };
        }

        const newSubscription = new DateSubscription({ clinicId, patientId, date: timestamp })
        await newSubscription.save()

        return {
            status: { code: 200, message: 'Subscription has been created successfully' },
            data: newSubscription
        }
    } catch (error) {
        console.error('Error creating subscription:', error)
        return { status: { code: 500, message: 'Internal server error' } }
    }
}

export const getSubscriptionsByPatient = async (message) => {
    try {
        const { patientId } = JSON.parse(message)

        // TO-DO: add checks for id validation

        const subscriptions = await DateSubscription.find({ patientId: { $in: [patientId] } });
        if (subscriptions.length < 1) {
            return {
                status: { code: 404, message: 'No subscriptions found for this patient' }
            };
        }

        return {
            status: { code: 200, message: 'Subscriptions retrieved successfully' },
            data: subscriptions
        };
    } catch (error) {
        console.error('Error fetching subscription:', error)
        return { status: { code: 500, message: 'Internal server error' } }
    }
}

export const getSubscriptionByClinicAndDate = async (message) => {
    try {
        const { clinicId, date } = JSON.parse(message)

        // TO-DO: add checks for id validation

        const subscriptions = await DateSubscription.find({ clinicId, date });
        if (subscriptions.length < 1) {
            return {
                status: { code: 404, message: 'No subscriptions found for this clinic at this date' }
            };
        }

        return {
            status: { code: 200, message: 'Subscriptions retrieved successfully' },
            data: subscriptions
        };
    } catch (error) {
        console.error('Error fetching subscription:', error)
        return { status: { code: 500, message: 'Internal server error' } }
    }
}

export const removeSubscription = async (message) => {
    try {
        const { subscriptionId, patientId } = JSON.parse(message);

        const subscription = await DateSubscription.findById(subscriptionId);

        if (!subscription) {
            return {
                status: { code: 404, message: 'Subscription not found' }
            };
        }
        if (patientId) {
            const index = subscription.patientId.findIndex(id => id.toString() === patientId);

            if (index !== -1) {
                subscription.patientId.splice(index, 1);
            }

            if (subscription.patientId.length === 0) {
                await subscription.deleteOne().exec();
                return {
                    status: { code: 200, message: 'Subscription removed as no patients remain' }
                };
            }

            await subscription.save();
            return {
                status: { code: 200, message: 'Patient removed from subscription successfully' },
                data: subscription
            };
        }

        await subscription.deleteOne().exec();
        return {
            status: { code: 200, message: 'Subscription removed successfully' },
            data: subscription
        };
    } catch (error) {
        console.error('Error removing subscription:', error);
        return { status: { code: 500, message: 'Internal server error' } };
    }
};

export const validateClinic = async (clinicId) => {
    const clientId = generateUniqueId();
    const payload = { _id: clinicId, clientId };
    const requestTopic = MQTT_TOPICS.CLINIC.RETRIEVE.ONE.REQUEST;
    const responseTopic = MQTT_TOPICS.CLINIC.RETRIEVE.ONE.RESPONSE(clientId);

    return new Promise(async (resolve, reject) => {
        let timeout;

        try {
            await subscribe(responseTopic, async (response) => {
                clearTimeout(timeout);

                await unsubscribe(responseTopic);

                if (response.data && response.data._id === clinicId) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });

            await publish(requestTopic, payload);

            timeout = setTimeout(async () => {
                await unsubscribe(responseTopic);
                resolve(false);
            }, 5000);
        } catch (error) {
            console.error('Error validating the clinic:', error);
            reject(false);
        }
    });
};