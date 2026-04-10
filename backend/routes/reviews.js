const express = require('express');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews/add
router.post('/add', protect, async (req, res) => {
    try {
        const { order_id, rating, review_text } = req.body;

        if (!order_id || !rating) {
            return res.status(400).json({ message: 'PROTOCOL_ERROR: DATA_MISSING' });
        }

        const order = await Order.findById(order_id);
        if (!order) return res.status(404).json({ message: 'MISSION_NOT_FOUND' });
        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'DEBRIEF_LOCKED: MISSION_INCOMPLETE' });
        }

        // Identify roles
        const isRequester = order.user_id.toString() === req.user._id.toString();
        const isPartner = order.delivery_partner_id?.toString() === req.user._id.toString();

        if (!isRequester && !isPartner) {
            return res.status(403).json({ message: 'ACCESS_DENIED: NOT_INVOLVED_IN_MISSION' });
        }

        // Determine reviewee
        const reviewee_id = isRequester ? order.delivery_partner_id : order.user_id;
        const reviewee_role = isRequester ? 'partner' : 'requester';

        if (!reviewee_id) {
            return res.status(400).json({ message: 'SYNC_ERROR: NO_REVIEWEE' });
        }

        // Prevent duplicate reviews FROM THIS REVIEWER for THIS ORDER
        const existing = await Review.findOne({ order_id, reviewer_id: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'DEBRIEF_EXISTS: MISSION_ALREADY_RATED' });
        }

        const review = await Review.create({
            order_id,
            reviewer_id: req.user._id,
            reviewee_id,
            reviewee_role,
            rating,
            review_text: review_text || '',
        });

        // Recalculate reviewee's average rating
        const allReviews = await Review.find({ reviewee_id });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await User.findByIdAndUpdate(reviewee_id, {
            rating: Math.round(avgRating * 10) / 10,
            total_reviews: allReviews.length,
        });

        res.status(201).json({ review, message: 'MISSION_DEBRIEF_SYNCED ✅' });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ message: 'SYNC_FAILURE' });
    }
});

// GET /api/reviews/partner/:partnerId
router.get('/partner/:partnerId', async (req, res) => {
    try {
        const reviews = await Review.find({ delivery_partner_id: req.params.partnerId })
            .populate('reviewer_id', 'name hostel')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
