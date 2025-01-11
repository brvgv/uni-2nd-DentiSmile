import { MqttClient } from 'mqtt'
import { ISubscriptionService } from './interfaces/ISubscriptionService'
import { MQTT_TOPICS } from './base/MQTTService'
import {
    RequestResponseManager,
    RequestType
} from '@/lib/RequestResponseManager'
import EventEmitter from 'events'

interface SubscriptionData {
    clinicId: string;
    patientId: string;
    date: Date;
}

const { SUBSCRIPTION } = MQTT_TOPICS.NOTIFICATION

export class SubscriptionService implements ISubscriptionService {
    private client: MqttClient
    private requestManager: RequestResponseManager<SubscriptionData>

    constructor(client: MqttClient) {
        this.client = client
        this.requestManager = new RequestResponseManager()
    }

    public createSubscription(
        clinicId: string,
        patientId: string,
        date: Date
    ): EventEmitter {
        try {
            const responseTopic = SUBSCRIPTION.CREATE.RESPONSE('')

            return this.requestManager.request(
                SUBSCRIPTION.CREATE.REQUEST,
                responseTopic,
                { clinicId, patientId, date },
                this.client,
                RequestType.DIRECT
            )
        } catch (error) {
            console.error(error)
            throw new Error(`Failed to create a subscription: ${error.message}`)
        }
    }
}
