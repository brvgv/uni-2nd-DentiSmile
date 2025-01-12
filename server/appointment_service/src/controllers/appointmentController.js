import mqttUtils from 'shared-mqtt'
const { MQTT_TOPICS, publish } = mqttUtils;
import AppointmentSlot from '../models/appointmentSlot.js'
import {
    generateSingleDaySlots,
    generateMultiDaySlots,
    isValidIsoDate
} from '../utils/dateUtils.js'
import { cacheAppointments, getAppointmentFromCache } from './cachingController.js';

const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const lockTimeouts = new Map();

export const bookAppointment = async (message) => {
    try {
        const { patientId, appointmentId } = JSON.parse(message)

        // TO-DO: add authorization

        // Clear timeout if it exists
        if (lockTimeouts.has(appointmentId)) {
            clearTimeout(lockTimeouts.get(appointmentId));
            lockTimeouts.delete(appointmentId);
        }

        const slot = await AppointmentSlot.findById(appointmentId)
        if (!slot) {
            return {
                status: { code: 404, message: 'Appointment slot not found' }
            }
        }

        if (slot.status !== 'available' && (slot.status !== 'locked' && slot.patientId !== patientId)) {
            return {
                status: {
                    code: 400,
                    message: 'Appointment slot is not available'
                }
            }
        }

        slot.status = 'booked';
        slot.patientId = patientId;
        await slot.save();
        notifyAppointmentBooked(slot.dentistId, slot.startTime, slot.endTime);

        return {
            status: {
                code: 200,
                message: 'Appointment slot booked successfully'
            },
            slot
        }
    } catch (error) {
        console.error(error)
        return { status: { code: 500, message: 'Error booking appointment' } }
    }
}

export const lockAppointment = async (message) => {
    try {
        const { patientId, appointmentId } = JSON.parse(message)
        const slot = await AppointmentSlot.findById(appointmentId)
        if (!slot) {
            return { status: { code: 404, message: 'Appointment not found' } }
        }
        if (slot.status === 'booked') {
            return {
                status: { code: 400, message: 'Appointment is already booked' }
            }
        }

        // Clear existing timeout if any
        if (lockTimeouts.has(appointmentId)) {
            clearTimeout(lockTimeouts.get(appointmentId));
            lockTimeouts.delete(appointmentId);
        }

        slot.status = 'locked'
        slot.patientId = patientId
        await slot.save()

        // Set new timeout
        const timeoutId = setTimeout(async () => {
            await unlockAppointment(JSON.stringify({ appointmentId }));
            lockTimeouts.delete(appointmentId);
        }, LOCK_TIMEOUT);

        lockTimeouts.set(appointmentId, timeoutId);

        const appointments = await AppointmentSlot.find({
            clinicId: slot.clinicId
        })

        return {
            status: { code: 200, message: 'Appointment locked successfully' },
            data: appointments
        }
    } catch (error) {
        console.error(error)
        return { status: { code: 500, message: 'Error locking appointment' } }
    }
}

export const unlockAppointment = async (message) => {
    try {
        const { appointmentId } = JSON.parse(message)

        // Clear timeout if it exists
        if (lockTimeouts.has(appointmentId)) {
            clearTimeout(lockTimeouts.get(appointmentId));
            lockTimeouts.delete(appointmentId);
        }

        const slot = await AppointmentSlot.findById(appointmentId)
        if (!slot) {
            return { status: { code: 404, message: 'Appointment not found' } }
        }

        if (slot.status === 'locked') {
            slot.status = 'available'
            slot.patientId = null
            await slot.save()
        }

        const appointments = await AppointmentSlot.find({
            clinicId: slot.clinicId
        })

        return {
            status: { code: 200, message: 'Appointment unlocked successfully' },
            data: appointments
        }
    } catch (error) {
        console.error(error)
        return { status: { code: 500, message: 'Error unlocking appointment' } }
    }
}

export const createAppointments = async (message) => {
    try {
        const {
            clinicName,
            clinicId,
            dentistId,
            startTime,
            endTime,
            duration
        } = JSON.parse(message)

        const additionalParams = { clinicName, clinicId, dentistId }

        if (!isValidIsoDate(startTime) || !isValidIsoDate(endTime)) {
            return {
                status: {
                    code: 400,
                    message:
                        'Invalid date format. Use ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) or (YYYY-MM-DDTHH:mm)'
                }
            }
        }

        const start = new Date(startTime)
        const end = new Date(endTime)

        if (start < new Date() || end < new Date()) {
            return {
                status: { code: 400, message: 'Dates cannot be in the past' }
            }
        }

        // TO-DO: authorization
        const existingSlots = await AppointmentSlot.find({
            dentistId,
            $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }]
        })

        if (existingSlots.length > 0) {
            return {
                status: {
                    code: 400,
                    message: 'Slots for this timeframe already exist'
                }
            }
        }

        const isSingleDay = end - start < 24 * 60 * 60 * 1000
        const slots = isSingleDay
            ? generateSingleDaySlots(start, end, duration, additionalParams)
            : generateMultiDaySlots(start, end, duration, additionalParams)

        if (slots.length < 1)
            return {
                status: { code: 400, message: 'Appointment duration invalid' }
            }

        await AppointmentSlot.insertMany(slots)

        // no need to await here 
        notifyAvailableSlots(clinicId, clinicName, slots)

        return {
            status: {
                code: 200,
                message: 'Appointment slots created successfully'
            }
        }
    } catch (error) {
        console.log(error)
        return {
            status: { code: 500, message: 'Error creating appointment slots' }
        }
    }
}

export const cancelAppointment = async (message) => {
    try {
        const { appointmentId } = JSON.parse(message)

        const appointment = await AppointmentSlot.findById(appointmentId)

        if (!appointment) {
            return {
                status: { code: 404, message: 'Appointment does not exist' }
            }
        }

        if (
            appointment.status === 'available' &&
            appointment.patientId === null
        ) {
            return {
                status: {
                    code: 400,
                    message: 'Appointment is already cancelled'
                }
            }
        }

        appointment.status = 'available'
        const patient = appointment.patientId;
        appointment.patientId = null
        await appointment.save()

        notifyAppointmentCanceled(appointment.clinicName, patient, appointment.dentistId, appointment.startTime, appointment.endTime);
        return {
            status: {
                code: 200,
                message: 'Appointment cancelled successfully'
            },
            data: appointment
        }
    } catch (error) {
        console.error(error)
        return {
            status: { code: 500, message: 'Error cancelling appointment' }
        }
    }
}

export const removeAppointment = async (message) => {
    try {
        const { appointmentId } = JSON.parse(message)
        const appointment = await AppointmentSlot.findByIdAndDelete(
            appointmentId
        )
        if (!appointment) {
            return { status: { code: 404, message: 'Appointment not found' } }
        }
        return {
            status: { code: 200, message: 'Appointment removed successfully' },
            data: appointment
        }
    } catch (error) {
        console.log(error)
        return { status: { code: 500, message: 'Error removing appointment' } }
    }
}

export const getAppointmentsByClinic = async (message) => {
    let clinicId;
    try {
        const { clinicId: parsedClinicId } = JSON.parse(message)
        clinicId = parsedClinicId;

        const appointments = await AppointmentSlot.find({ clinicId })

        if (appointments.length < 1) {
            return { status: { code: 404, message: 'Appointments not found' } }
        }

        //cache appointments for the next 96 hours for this clinic
        const now = new Date();
        const cutoffTime = new Date(now.getTime() + 96 * 60 * 60 * 1000); // 96 hours from now
        const upcomingAppointments = appointments.filter(appointment =>
            new Date(appointment.startTime) >= now && new Date(appointment.startTime) <= cutoffTime
        );
        await cacheAppointments(clinicId, upcomingAppointments);

        return {
            status: {
                code: 200,
                message: 'Appointments retrieved successfully'
            },
            data: appointments
        }
    } catch (dbError) {
        console.error(dbError);
        try {
            const cachedAppointments = await getAppointmentFromCache(clinicId);

            if (cachedAppointments) {
                return {
                    status: {
                        code: 200,
                        message: 'Appointments retrieved successfully from cache'
                    },
                    data: JSON.parse(cachedAppointments) // Parse cached JSON string back to object
                };
            }

            return {
                status: {
                    code: 500,
                    message: 'Database failure and no cached data available'
                }
            };
        } catch (cacheError) {
            console.error(cacheError);
            return { status: { code: 500, message: 'Error fetching appointments' } }
        }
    }
}

export const getAppointmentsByDentist = async (message) => {
    try {
        const { dentistId, startingDate, endingDate } = JSON.parse(message)

        if (!dentistId || !startingDate || !endingDate) {
            return {
                status: {
                    code: 400,
                    message:
                        'Missing required fields. Expected query format: ?dentistId=abcd&startingDate=YYYY-MM-DD&endingDate=YYYY-MM-DD'
                }
            }
        }

        const appointments = await AppointmentSlot.find({
            dentistId: dentistId,
            startTime: {
                $gte: new Date(startingDate),
                $lte: new Date(endingDate)
            }
        })
        return {
            status: {
                code: 200,
                message: 'Appointments retrieved successfully'
            },
            data: appointments
        }
    } catch (error) {
        console.log(error)
        return { status: { code: 500, message: 'Error fetching appointments' } }
    }
}

export const getAppointmentById = async (message) => {
    try {
        const { appointmentId } = JSON.parse(message)
        const slot = await AppointmentSlot.findById(appointmentId)
        if (!slot) {
            return { status: { code: 404, message: 'Appointment not found' } }
        }
        return {
            status: {
                code: 200,
                message: 'Appointment retrieved successfully'
            },
            data: slot
        }
    } catch (error) {
        console.log(error)
        return { status: { code: 500, message: 'Error fetching slot details' } }
    }
}

export const getAppointmentsByPatientId = async (message) => {
    try {
        const { patientId } = JSON.parse(message)
        const slot = await AppointmentSlot.find({ patientId: patientId })
        if (!slot) {
            return { status: { code: 404, message: 'Appointments not found' } }
        }
        return {
            status: {
                code: 200,
                message: 'Appointments retrieved successfully'
            },
            data: slot
        }
    } catch (error) {
        console.log(error);
        return { status: { code: 500, message: 'Error fetching appointments' } };
    }
};

const notifyAvailableSlots = async (clinicId, clinicName, slots) => {
    try {
        const groupedByDay = [...new Set(slots.map(slot => {
            const startDate = new Date(slot.startTime);
            return startDate.toISOString().split('T')[0];
        }))];
        const payload = { clinicId, clinicName, dates: groupedByDay }
        await publish(MQTT_TOPICS.NOTIFICATION.EVENT.AVAILABILITY, payload);
    } catch (error) {
        console.log('Error publishing event', error)
    }
}

const notifyAppointmentCanceled = async (clinicName, patientId, dentistId, startTime, endTime) => {
    try {
        const payload = { clinicName, patientId, dentistId, startTime, endTime };
        await publish(MQTT_TOPICS.NOTIFICATION.EVENT.APPOINTMENT.CANCELED, payload);
    } catch (error) {
        console.log('Error publishing event', error)
    }
}

const notifyAppointmentBooked = async (dentistId, startTime, endTime) => {
    try {
        const payload = { dentistId, startTime, endTime };
        await publish(MQTT_TOPICS.NOTIFICATION.EVENT.APPOINTMENT.BOOKED, payload);
    } catch (error) {
        console.log('Error publishing event', error)
    }
}
