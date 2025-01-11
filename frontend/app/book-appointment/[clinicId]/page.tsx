'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import useClinicAppointments from '@/hooks/useClinicAppointments'
import { useBooking } from '@/hooks/useBooking'
import ReasonSelection from '@/components/booking/ReasonSelection'
import DateTimeSelection from '@/components/booking/date-time/DateTimeSelection'
import Confirmation from '@/components/booking/Confirmation'
import { getAvailableReasons } from '@/lib/reasonStore'

export default function BookAppointmentPage() {
    const { clinicId } = useParams() as { clinicId: string }
    const [currentStep, setCurrentStep] = useState<
        'reason' | 'datetime' | 'confirmation'
    >('reason')
    const [reasonId, setReasonId] = useState<string>('')
    const [duration, setDuration] = useState<number | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [selectedTime, setSelectedTime] = useState<Date>()
    const [appointmentConfirmed, setAppointmentConfirmed] = useState(false)
    const [selectedAppointmentId, setSelectedAppointmentId] =
        useState<string>('')
    const [result, setResult] = useState<{
        success: boolean
        error?: string
        data?: {
            appointmentId: string
            status: string
        }
    }>({ success: true })

    const router = useRouter()

    const {
        clinicName,
        monthlyAvailability,
        availableTimes,
        lockAppointment,
        unlockAppointment,
        clearLock
    } = useClinicAppointments({
        clinicId,
        reasonId,
        selectedDate
    })

    const { requestAppointment } = useBooking()

    useEffect(() => {
        if (appointmentConfirmed) {
            toast.success('Appointment Confirmed!', {
                description: `Your appointment has been successfully booked.`
            })
            router.replace('/account')
        }
    }, [appointmentConfirmed, router])

    const handleReasonSelect = (selectedReasonId: string) => {
        setReasonId(selectedReasonId)
        const reasons = getAvailableReasons()
        const chosenReason = reasons.find((r) => r.id === selectedReasonId)
        setDuration(chosenReason ? chosenReason.duration : 30)
        setCurrentStep('datetime')
    }

    const handleDateTimeSelect = async (
        date: Date,
        time: Date,
        appointmentId: string
    ) => {
        if (selectedAppointmentId) {
            unlockAppointment(selectedAppointmentId)
        }
        lockAppointment(
            appointmentId,
            localStorage.getItem('userId') || '',
            clinicId
        )
        setSelectedDate(date)
        setSelectedTime(time)
        setSelectedAppointmentId(appointmentId)
        setCurrentStep('confirmation')
    }

    const handleConfirm = async () => {
        if (
            !reasonId ||
            !selectedDate ||
            !selectedTime ||
            !selectedAppointmentId
        )
            return

        const userId = localStorage.getItem('userId')
        if (!userId) {
            console.error('User ID not found')
            return
        }
        const bookingResult = await requestAppointment(
            selectedAppointmentId,
            userId
        )

        setResult(bookingResult)

        if (bookingResult.error) {
            toast.error("Your Appointment Booking Didn't go through :(", {
                description: bookingResult.error
            })
        }

        if (bookingResult.success && bookingResult.data) {
            clearLock()
            setAppointmentConfirmed(true)
        }
    }

    return (
        <div className="w-full mt-5 max-w-3xl mx-auto">
            <h1 className="my-4 text-2xl font-medium">
                Schedule Your Dental Appointment
            </h1>

            <div>
                <div className="border border-b-0 p-4 py-2 rounded-t-lg flex justify-between items-center text-gray-600 text-sm">
                    <p>{clinicName}</p>
                    <Button variant="ghost" asChild>
                        <Link href="/">Edit</Link>
                    </Button>
                </div>
                <ReasonSelection
                    isActive={currentStep === 'reason'}
                    onSelect={handleReasonSelect}
                    selectedReason={reasonId}
                    onEdit={() => {
                        setReasonId('')
                        setSelectedDate(undefined)
                        setSelectedTime(undefined)
                        setDuration(null)
                        setCurrentStep('reason')
                    }}
                />
                <DateTimeSelection
                    isActive={currentStep === 'datetime'}
                    onSelect={handleDateTimeSelect}
                    onEdit={() => setCurrentStep('datetime')}
                    clinicId={clinicId}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    setSelectedDate={setSelectedDate}
                    setSelectedTime={setSelectedTime}
                    appointmentDuration={duration || 30}
                    availableTimes={availableTimes}
                    monthlyAvailability={monthlyAvailability}
                />
                <Confirmation
                    isActive={currentStep === 'confirmation'}
                    reason={reasonId}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onConfirm={handleConfirm}
                    appointmentDuration={duration || 30}
                    disableButton={!!result.data}
                />
            </div>
        </div>
    )
}
