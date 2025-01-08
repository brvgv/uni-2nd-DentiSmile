import { Button } from '../ui/button';
import { useAppointmentSubscription } from '@/hooks/useAppointmentSubscription';
import { useEffect } from 'react';

const AppointmentSubscription = ({ clinicId, patientId, date }: { clinicId: string; patientId: string; date: Date; }) => {
    const { isLoading, error, subscriptionResponse, subscribeToDate, resetResponse } = useAppointmentSubscription();

    const handleSubscribe = async () => {
        await subscribeToDate(clinicId, patientId, date)
    }

    useEffect(() => {
        resetResponse()
    }, [clinicId, patientId, date, resetResponse])

    return (
        <>
            <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                variant="link"
            >
                {isLoading ? 'Subscribing...' : 'Subscribe'}
            </Button>{' '}
            to future appointments on this day.
            <div>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                {subscriptionResponse && <h3 className='text-green-700'>Subscription Successful!</h3>}
            </div>
        </>
    )
}

export default AppointmentSubscription
