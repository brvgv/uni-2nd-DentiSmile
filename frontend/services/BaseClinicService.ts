/* eslint-disable @typescript-eslint/no-explicit-any */
import { IClinicService } from './interfaces/IClinicService'
import { RequestResponseManager } from '@/lib/RequestResponseManager'
import { EventEmitter } from 'events'

export abstract class BaseClinicService implements IClinicService {
    protected client: any
    protected requestManager: RequestResponseManager<any>

    constructor(client: any) {
        this.client = client
        this.requestManager = new RequestResponseManager()

        if (!client || typeof client.on !== 'function') {
            throw new Error('Invalid MQTT client provided')
        }
    }

    public abstract getClinics(): EventEmitter

    public abstract getClinicAppointments(
        clinicId: string,
        reasonId?: string,
        date?: string
    ): EventEmitter

    public abstract disconnect(): Promise<void>
}
