import { IBookingService } from './interfaces/IBookingService'
import { MQTT_TOPICS } from './base/MQTTService'
import { BaseBookingService } from './BaseBookingService'
import {
    RequestResponseManager,
    RequestType
} from '@/lib/RequestResponseManager'
import { MqttClient } from 'mqtt'
import { EventEmitter } from 'events'


export class BookingService
    extends BaseBookingService
    implements IBookingService
{
    protected requestManager: RequestResponseManager<{
        appointmentId?: string;
        patientId?: string;
        clinicId?: string;
        reasonId?: string;
        date?: string;
    }>

    constructor(client: MqttClient) {
        super(client)
        this.requestManager = new RequestResponseManager()

        if (!client || typeof client.on !== 'function') {
            throw new Error('Invalid MQTT client provided')
        }
    }

    public requestAppointment(
        appointmentId: string,
        patientId: string
    ): EventEmitter {
        return this.requestManager.request(
            MQTT_TOPICS.APPOINTMENT.BOOK.REQUEST,
            MQTT_TOPICS.APPOINTMENT.BOOK.RESPONSE(''),
            { appointmentId, patientId },
            this.client,
            RequestType.DIRECT
        )
    }

    public cancelBooking(appointmentId: string): EventEmitter {
        return this.requestManager.request(
            MQTT_TOPICS.APPOINTMENT.CANCEL.REQUEST,
            MQTT_TOPICS.APPOINTMENT.CANCEL.RESPONSE(''),
            { appointmentId },
            this.client,
            RequestType.DIRECT
        )
    }

    public getBookings(patientId: string): EventEmitter {
        return this.requestManager.request(
            MQTT_TOPICS.APPOINTMENT.PATIENT.RETRIEVE.REQUEST,
            MQTT_TOPICS.APPOINTMENT.PATIENT.RETRIEVE.RESPONSE(''),
            { patientId },
            this.client,
            RequestType.DIRECT
        )
    }

    public getBookingAppointments(
        clinicId: string,
        reasonId?: string,
        date?: string
    ): EventEmitter {
        return this.requestManager.request(
            MQTT_TOPICS.APPOINTMENT.GET.REQUEST,
            MQTT_TOPICS.APPOINTMENT.GET.RESPONSE(''),
            { clinicId, reasonId, date },
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
