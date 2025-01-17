/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBookingService } from './interfaces/IBookingService'
import { RequestResponseManager } from '@/lib/RequestResponseManager'
import { EventEmitter } from 'events'
import { MqttClient } from 'mqtt'

export abstract class BaseBookingService implements IBookingService {
    protected client: MqttClient
    protected requestManager: RequestResponseManager<{
        appointmentId?: string
        patientId?: string
        clinicId?: string
        reasonId?: string
        date?: string
    }>

    constructor(client: any) {
        this.client = client
        this.requestManager = new RequestResponseManager()

        if (!client || typeof client.on !== 'function') {
            throw new Error('Invalid MQTT client provided')
        }
    }

    public abstract requestAppointment(
        appointmentId: string,
        patientId: string
    ): EventEmitter

    public abstract cancelBooking(bookingId: string): EventEmitter

    public abstract getBookings(patientId: string): EventEmitter

    public abstract getBookingAppointments(
        clinicId: string,
        reasonId?: string,
        date?: string
    ): EventEmitter

    public abstract disconnect(): Promise<void>
}
