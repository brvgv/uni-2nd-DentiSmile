import { MQTT_TOPICS } from './base/MQTTService'
import { BaseNotificationService } from './base/BaseNotificationService'
import { MqttClient } from 'mqtt'
import { EventEmitter } from 'events'

const { APPOINTMENT } = MQTT_TOPICS.NOTIFICATION

export class NotificationService extends BaseNotificationService {
    private patientId: string | null = null

    constructor(client: MqttClient) {
        super(client)
    }

    public setPatientId(patientId: string) {
        this.patientId = patientId
    }

    public subscribeToNotifications(): EventEmitter {
        if (!this.patientId) {
            throw new Error(
                'PatientId must be set before subscribing to notifications'
            )
        }

        const emitter = new EventEmitter()

        // Subscribe to availability notifications
        const availabilityEmitter = this.requestManager.subscribeOnly(
            APPOINTMENT.CREATED(this.patientId),
            this.client
        )

        // Subscribe to cancellation notifications
        const cancellationEmitter = this.requestManager.subscribeOnly(
            APPOINTMENT.CANCELED(this.patientId),
            this.client
        )

        availabilityEmitter.on('data', (message) => {
            emitter.emit('message', {
                ...message,
                type: 'Availability',
                timestamp: new Date()
            })
        })

        cancellationEmitter.on('data', (message) => {
            emitter.emit('message', {
                ...message,
                type: 'Cancellation',
                timestamp: new Date()
            })
        })

        return emitter
    }
}
