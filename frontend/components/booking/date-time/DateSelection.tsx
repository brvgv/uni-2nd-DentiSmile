'use client'

import Calendar, { TileDisabledFunc } from 'react-calendar'
import './Calendar.css'
import { parseDateTime } from '@/lib/dateUtils'

interface DateSelectionProps {
    setSelectedDate: (date: Date) => void
    selectedDate?: Date
    disabled?: boolean
    clinicId: string
    monthlyAvailability: Record<string, number>
}

export default function DateSelection({
    setSelectedDate,
    selectedDate,
    disabled,
    monthlyAvailability
}: DateSelectionProps) {
    const isTileDisabled: TileDisabledFunc = ({ date }) => {
        const day = date.getDay()

        // Disable if it's a weekend or today
        if (day === 0 || day === 6 || date <= new Date()) {
            return true
        }

        return false
    }

    function tileClassName({ date }: { date: Date }) {
        const { dateKey } = parseDateTime(date)

        // Highlight dates based on availability
        if (monthlyAvailability[dateKey] && monthlyAvailability[dateKey] > 0) {
            return 'bg-green-50 text-green-700'
        }

        return ''
    }

    return (
        <>
            <Calendar
                onChange={(value) => {
                    if (!disabled) {
                        if (Array.isArray(value)) {
                            if (value[0]) setSelectedDate(value[0])
                        } else if (value) {
                            setSelectedDate(value)
                        }
                    }
                }}
                value={selectedDate}
                tileDisabled={isTileDisabled}
                tileClassName={tileClassName}
                minDate={new Date()}
            />
            <div className="mt-4 flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 border"></div>
                <span className="text-sm text-gray-600">
                    Days with available times
                </span>
            </div>
        </>
    )
}
