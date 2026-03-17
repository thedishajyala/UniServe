const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/order/:orderId — Fetch chat history
router.get('/order/:orderId', protect, async (req, res) => {
    try {
        const messages = await Message.find({ order_id: req.params.orderId })
            .populate('sender_id', 'name hostel')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

module.exports = router;
