import { IClinicService } from './interfaces/IClinicService'
import { MQTT_TOPICS } from './base/MQTTService'
import { BaseClinicService } from './BaseClinicService'
import {
    RequestResponseManager,
    RequestType
} from '@/lib/RequestResponseManager'
import { MqttClient } from 'mqtt'
import { EventEmitter } from 'events'

export class ClinicService extends BaseClinicService implements IClinicService {
    protected requestManager: RequestResponseManager<unknown>

    constructor(client: MqttClient) {
        super(client)
        this.requestManager = new RequestResponseManager()

        if (!client || typeof client.on !== 'function') {
            throw new Error('Invalid MQTT client provided')
        }
    }

    public getClinics(): EventEmitter {
        return this.requestManager.request(
            MQTT_TOPICS.CLINIC.RETRIEVE.MANY.REQUEST,
            MQTT_TOPICS.CLINIC.RETRIEVE.MANY.RESPONSE(''),
            {},
            this.client,
            RequestType.BROADCAST
        )
    }

    public getClinicAppointments(
        clinicId: string,
        reasonId: string,
        date: string
    ): EventEmitter {
        return this.requestManager.request(
            MQTT_TOPICS.APPOINTMENT.CLINIC.RETRIEVE.REQUEST,
            MQTT_TOPICS.APPOINTMENT.CLINIC.RETRIEVE.RESPONSE(clinicId),
            { clinicId, reasonId, date, clientId: clinicId },
            this.client,
            RequestType.BROADCAST
        )
    }

    public lockAppointmentSlot(
        appointmentId: string,
        patientId: string,
        clinicId: string
    ): EventEmitter {
        return this.requestManager.request(
            MQTT_TOPICS.APPOINTMENT.LOCK.REQUEST,
            MQTT_TOPICS.APPOINTMENT.LOCK.RESPONSE(clinicId),
            { appointmentId, patientId, clientId: clinicId },
            this.client,
            RequestType.BROADCAST
        )
    }

    public unlockAppointmentSlot(appointmentId: string): EventEmitter {
        return this.requestManager.request(
            MQTT_TOPICS.APPOINTMENT.UNLOCK.REQUEST,
            MQTT_TOPICS.APPOINTMENT.UNLOCK.RESPONSE(''),
            { appointmentId },
            this.client,
            RequestType.BROADCAST
        )
    }

    public async disconnect(): Promise<void> {
        try {
            this.requestManager.unsubscribeAll(this.client)
            if (this.client.connected) {
                await new Promise<void>((resolve) => {
                    this.client.end(false, {}, () => resolve())
                })
            }
        } catch (error) {
            throw new Error(`Failed to disconnect: ${error.message}`)
        }
    }
}
