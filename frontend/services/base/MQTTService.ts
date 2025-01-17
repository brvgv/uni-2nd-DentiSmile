import { MqttClient } from 'mqtt'
import mqtt from 'shared-mqtt'
import { MQTT_BROKER_URL } from '@/lib/constants'

const { connectMQTT, MQTT_TOPICS } = mqtt

class MQTTService {
    private static instance: MqttClient
    private static isConnecting: boolean = false

    public static async getClient() {
        if (!MQTTService.instance && !MQTTService.isConnecting) {
            MQTTService.isConnecting = true
            MQTTService.instance = await connectMQTT(MQTT_BROKER_URL)
            MQTTService.isConnecting = false
        }
        return MQTTService.instance
    }
}

export { MQTTService, MQTT_TOPICS }
