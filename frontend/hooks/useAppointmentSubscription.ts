import { useState, useEffect } from 'react';
import { SubscriptionService } from '@/services/SubscriptionService';
import { MQTTService } from '@/services/base/MQTTService';
import { ISubscriptionService } from '@/services/interfaces/ISubscriptionService';

export function useAppointmentSubscription() {
    const [subscriptionService, setSubscriptionService] = useState<ISubscriptionService | null>(null)
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const initNotificationService = async () => {
            try {
                const client = await MQTTService.getClient()
                const service = new SubscriptionService(client)
                setSubscriptionService(service)
            } catch (error) {
                setError(error)
            }
        }
        initNotificationService()
    }, []) // run once when component mounts

    const subscribeToDate = async (
        clinicId: string,
        patientId: string,
        date: Date
    ) => {
        setLoading(true)
        return new Promise<{
            success: boolean
            response?: string
            error?: string
        }>((resolve) => {
            const emitter = subscriptionService?.createSubscription(clinicId, patientId, date);

            const onData = (response: string) => {
                resolve({ success: true, response });
                setError(null);
                setLoading(false);
                emitter?.removeListener('error', onError);
                emitter?.removeListener('data', onData);
            }

            const onError = (err: Error) => {
                resolve({ success: false, error: err.message });
                setError(err);
                setLoading(false);
                emitter?.removeListener('error', onError);
                emitter?.removeListener('data', onData);
            }

            emitter?.once('data', onData);
            emitter?.once('error', onError);
        });
    }

    return {
        isLoading,
        error,
        subscribeToDate,
    }
}

export default useAppointmentSubscription
