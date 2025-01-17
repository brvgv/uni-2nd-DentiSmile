/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { IAppointment } from '@/services/interfaces/IAppointment'
import { parseDateTime } from '@/lib/dateUtils'
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from '@/components/ui/alert-dialog'

interface AppointmentsTableProps {
    appointments: IAppointment[]
    onCancel: (id: string) => Promise<{ success: boolean; message?: string }>
}

export function AppointmentsTable({
    appointments,
    onCancel
}: AppointmentsTableProps) {
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    const handleConfirm = async () => {
        try {
            if (!cancellingId) return;
            const result = await onCancel(cancellingId)
            if (result.success) {
                toast.success('Appointment Cancelled', {
                    description:
                        result.message ||
                        'The appointment was successfully cancelled.'
                })
            } else {
                throw new Error(result.message || 'Cancellation failed.')
            }
        } catch (error) {
            toast.error('Failed to cancel appointment. Please try again.')
        } finally {
            setCancellingId(null)
        }
    }


    return (
        <>
            <AlertDialog>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.map((appointment) => {
                            const { dateKey, timeStr } = parseDateTime(
                                appointment.startTime
                            )
                            return (
                                <TableRow key={appointment._id}>
                                    <TableCell>{dateKey}</TableCell>
                                    <TableCell>{timeStr}</TableCell>
                                    <TableCell>
                                        {appointment.clinicName}
                                    </TableCell>
                                    <TableCell>
                                        <AlertDialogTrigger onClick={() => setCancellingId(appointment._id)} className="text-red-500 border border-red-500 rounded px-2 py-1">
                                            Cancel Appointment
                                        </AlertDialogTrigger>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to cancel this appointment?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will action will
                            cancel your appointment.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abort</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
