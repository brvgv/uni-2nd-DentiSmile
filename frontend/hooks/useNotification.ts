import { useState, useEffect } from 'react'
import { NotificationService } from '@/services/NotificationService'
import { NotificationMessage } from '@/services/interfaces/INotificationService'
import { useMQTTService } from './useMQTTService'
import mockNotificationService from '@/services/mocks/mockNotificationService'
import { toast } from 'sonner'
import { parseDateTime } from '@/lib/dateUtils'

export function useNotification(patientId?: string) {
    const { service: notificationService, error: serviceError } =
        useMQTTService(NotificationService, mockNotificationService)

    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(serviceError)

    useEffect(() => {
        if (!notificationService || !patientId) return

        if (notificationService instanceof NotificationService) {
            notificationService.setPatientId(patientId)
        }

        setLoading(true)
        const notificationsEmitter =
            notificationService.subscribeToNotifications()

        const onMessage = ({
            notification,
            timestamp,
            type
        }: NotificationMessage) => {
            if (notification) {
                toast.info(type, {
                    description: notification,
                    descriptionClassName: '!text-white',
                    action: {
                        label: parseDateTime(timestamp).timeStr,
                        onClick: () => {}
                    }
                })
            }

            setLoading(false)
        }

        const onError = (err: Error) => {
            setError(err)
            setLoading(false)
        }

        notificationsEmitter.on('message', onMessage)
        notificationsEmitter.on('error', onError)

        return () => {
            notificationsEmitter.removeAllListeners()
            notificationService.disconnect()
        }
    }, [notificationService, patientId])

    return {
        loading,
        error
    }
}
