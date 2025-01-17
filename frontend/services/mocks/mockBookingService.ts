import EventEmitter from 'events'
import { BaseBookingService } from '../BaseBookingService'
import { IBookingService } from '../interfaces/IBookingService'

class MockBookingService extends BaseBookingService implements IBookingService {
    constructor() {
        super(null)
    }

    requestAppointment(
        appointmentId: string,
        _patientId: string
    ): EventEmitter {
        const emitter = new EventEmitter();
        setTimeout(() => {
            emitter.emit('data', {
                appointmentId,
                status: 'confirmed',
                dateTime: new Date().toISOString()
            });
        }, 500);
        return emitter;
    }
    public cancelBooking(bookingId: string): EventEmitter {
        const emitter = new EventEmitter();
        setTimeout(() => {
            if (!bookingId) {
                emitter.emit('error', 'Booking ID is required');
                return;
            }
            emitter.emit('data', {
                bookingId,
                status: 'cancelled',
                cancelledAt: new Date().toISOString()
            });
        }, 500);
        return emitter;
    }

    public getBookings(patientId: string): EventEmitter {
        const emitter = new EventEmitter();
        setTimeout(() => {
            emitter.emit('data', {
                data: []
            });
        }, 500);
        return emitter;
    }

    public getBookingAppointments(
        clinicId: string,
        reasonId?: string,
        date?: string
    ): EventEmitter {
        const emitter = new EventEmitter();
        setTimeout(() => {
            emitter.emit('data', {
                data: []
            });
        }, 500);
        return emitter;
    }

    public disconnect(): Promise<void> {
        throw new Error('Method not implemented.')
    }
}

export default MockBookingService
