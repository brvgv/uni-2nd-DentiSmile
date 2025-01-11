/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAuthService } from './interfaces/IAuthService'
import {
    RequestResponseManager,
    RequestType
} from '@/lib/RequestResponseManager'
import { MQTT_TOPICS } from './base/MQTTService'
import { EventEmitter } from 'events'

const { AUTHENTICATION } = MQTT_TOPICS

export interface AuthData {
    token: string
    userId: string
}

export class AuthService implements IAuthService {
    private client: any
    private requestManager: RequestResponseManager<any>

    constructor(client: any) {
        this.client = client
        this.requestManager = new RequestResponseManager()
    }

    public register(email: string, password: string): EventEmitter {
        const responseTopic = AUTHENTICATION.REGISTER.RESPONSE('')

        return this.requestManager.request(
            AUTHENTICATION.REGISTER.REQUEST,
            responseTopic,
            { email, password },
            this.client,
            RequestType.DIRECT
        )
    }

    public login(email: string, password: string): EventEmitter {
        const responseTopic = AUTHENTICATION.LOGIN.RESPONSE('')

        return this.requestManager.request(
            AUTHENTICATION.LOGIN.REQUEST,
            responseTopic,
            { email, password },
            this.client,
            RequestType.DIRECT
        )
    }

    public disconnect(): Promise<void> {
        return Promise.resolve()
    }
}
