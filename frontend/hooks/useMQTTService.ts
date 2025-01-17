import { useState, useEffect } from 'react'
import { MQTTService } from '@/services/base/MQTTService'

export const useMQTTService = (ServiceClass, _MockSeviceClass) => {
    const [service, setService] = useState<typeof ServiceClass | null>(null)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const initializeService = async () => {
            try {
                const client = await MQTTService.getClient()
                setService(new ServiceClass(client))
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error('Failed to initialize service')
                )
            }
        }
        initializeService()
    }, [ServiceClass])

    return { service, error }
}
