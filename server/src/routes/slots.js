import express from 'express';
import Slot from '../models/SlotSchema.js';

const router = express.Router();

router.get('/slots/available', async (req, res) => {
    try {
        const availableSlots = await Slot.find({ status: 'available' });
        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

export default router;
