import { Button } from '../ui/button'
import { useAppointmentSubscription } from '@/hooks/useAppointmentSubscription'
import { toast } from 'sonner'

const AppointmentSubscription = ({
    clinicId,
    date
}: {
    clinicId: string
    date: Date
}) => {
    const { isLoading, subscribeToDate } = useAppointmentSubscription()

    const handleSubscribe = async () => {
        const patientId = localStorage.getItem('userId')

        if (!patientId) {
            toast.info('Please log in to subscribe.')
            return
        }
        const { success, error } = await subscribeToDate(
            clinicId,
            patientId,
            date
        )

        if (success) {
            toast.success('Successful Subscription!', {
                description:
                    "You'll get notified once there's any available appointment on this day"
            })
        } else if (error) {
            toast.warning('Failed Subscription!', {
                description: error
            })
        }
    }

    return (
        <>
            <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                variant="link"
                className="px-1 font-bold"
            >
                {isLoading ? 'Subscribing...' : 'Subscribe'}
            </Button>
            to future appointments on this day.
        </>
    )
}

export default AppointmentSubscription
