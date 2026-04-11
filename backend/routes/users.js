const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, hostel, room_no, enrollment_no, phone } = req.body;
        const user = await User.findById(req.user._id);

        if (name && name !== user.name) {
            if (user.name_changed_once) {
                return res.status(400).json({ message: 'You can only change your name once' });
            }
            user.name = name;
            user.name_changed_once = true;
        }
        if (hostel) user.hostel = hostel;
        if (room_no) user.room_no = room_no;
        if (enrollment_no) user.enrollment_no = enrollment_no;
        if (phone) user.phone = phone;

        user.profile_complete = !!(user.name && user.enrollment_no && user.hostel && user.room_no && user.phone);
        user.last_active = new Date();

        const updatedUser = await user.save();
        const userObj = updatedUser.toObject();
        delete userObj.password;

        res.json(userObj);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/users/toggle-availability
router.post('/toggle-availability', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.profile_complete) {
            return res.status(400).json({ message: 'Complete your profile before going online' });
        }

        user.is_available = !user.is_available;
        user.last_active = new Date();
        await user.save();

        res.json({
            is_available: user.is_available,
            message: user.is_available ? 'You are now online and accepting deliveries!' : 'You are now offline',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/users/earnings
router.get('/earnings', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('total_earnings total_deliveries successful_deliveries rating');

        // Get today's earnings from completed deliveries
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayDeliveries = await Order.find({
            delivery_partner_id: req.user._id,
            status: 'delivered',
            delivered_at: { $gte: today },
        });

        const today_earnings = todayDeliveries.reduce((sum, o) => sum + o.delivery_earning, 0);

        // Weekly earnings (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekDeliveries = await Order.find({
            delivery_partner_id: req.user._id,
            status: 'delivered',
            delivered_at: { $gte: weekAgo },
        });
        const week_earnings = weekDeliveries.reduce((sum, o) => sum + o.delivery_earning, 0);

        res.json({
            total_earnings: user.total_earnings,
            today_earnings,
            week_earnings,
            total_deliveries: user.total_deliveries,
            successful_deliveries: user.successful_deliveries,
            rating: user.rating,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/users/online
router.get('/online', protect, async (req, res) => {
    try {
        const users = await User.find({ is_available: true, _id: { $ne: req.user._id } })
            .limit(3)
            .select('name rating hostel total_deliveries total_reviews');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
