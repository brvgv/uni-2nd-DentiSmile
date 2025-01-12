import setupMQTT from './config/mqtt.js'
import { startupScreen } from './menu/startup.js'
import { getClientId } from './util/clientId.js'
const MQTT_URI = process.env.MQTT_URI || 'mqtt://localhost:1883'

const MQTT_OPTIONS = {
    clientId: getClientId(),
    reconnectPeriod: 2000,
    connectTimeout: 30 * 1000,
    clean: true
}

await setupMQTT(MQTT_URI, MQTT_OPTIONS)

// Start the application
await startupScreen();