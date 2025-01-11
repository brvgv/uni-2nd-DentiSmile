import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeSlot } from '@/lib/appointmentUtils'
import { parseDateTime } from '@/lib/dateUtils'

interface TimeSelectionProps {
    setSelectedTime: (date: Date, appointmentId: string) => void
    selectedTime: Date | null
    disabled?: boolean
    clinicId: string
    appointmentDuration: number
    availableTimes: TimeSlot[]
}

export default function TimeSelectionComponent({
    appointmentDuration,
    setSelectedTime,
    selectedTime,
    disabled,
    availableTimes
}: TimeSelectionProps) {
    // Add a step to remove duplicates
    const uniqueTimes = availableTimes.filter(
        (slot, index, self) =>
            self.findIndex((s) => s.time === slot.time) === index
    )

    return (
        <>
            <h3 className="font-semibold mt-8">Select a time</h3>
            <p className="text-sm text-gray-500">
                The examination takes about {appointmentDuration} minutes.
            </p>
            {uniqueTimes.length > 0 ? (
                <ul className="grid grid-cols-3 gap-3 mt-5 text-center">
                    {uniqueTimes
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map(({ appointmentId, time }) => (
                            <li
                                key={appointmentId}
                                className={cn(
                                    'border rounded-md cursor-pointer py-2 px-10',
                                    selectedTime &&
                                        parseDateTime(selectedTime).timeStr === time
                                        ? 'bg-sky-200'
                                        : ''
                                )}
                                onClick={() => {
                                    if (disabled) return

                                    const [hours, minutes] = time
                                        .split(':')
                                        .map(Number)
                                    const date = selectedTime
                                        ? new Date(selectedTime)
                                        : new Date()
                                    date.setHours(hours, minutes, 0, 0)
                                    setSelectedTime(date, appointmentId)
                                }}
                            >
                                {time}
                            </li>
                        ))}
                </ul>
            ) : (
                <Alert className="mt-8 bg-sky-100">
                    <Info size={22} />
                    <AlertTitle className="mt-1">
                        No available times on this date
                    </AlertTitle>
                    <AlertDescription>Choose another date.</AlertDescription>
                </Alert>
            )}
        </>
    )
}
