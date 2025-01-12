import redisClient from "../config/cache.js";

const EXPIRE_IN = 96 * 60 * 60; // 96 hours

export const cacheAppointments = async (clinicId, appointmentsData) => {
    const key = `appointment:${clinicId}`;
    await redisClient.set(key, JSON.stringify(appointmentsData), {
        EX: EXPIRE_IN,
        NX: true // cache if not exists yet
    });
}

export const getAppointmentFromCache = async (clinicId) => {
    const key = `appointment:${clinicId}`;
    const appointment = await redisClient.get(key);
    return appointment;
}

