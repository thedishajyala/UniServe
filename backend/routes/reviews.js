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
            return res.status(400).json({ message: 'Order ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const order = await Order.findById(order_id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Can only review delivered orders' });
        }
        if (order.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the order requester can leave a review' });
        }

        // Prevent duplicate reviews
        const existing = await Review.findOne({ order_id });
        if (existing) {
            return res.status(400).json({ message: 'Review already submitted for this order' });
        }

        const review = await Review.create({
            order_id,
            reviewer_id: req.user._id,
            delivery_partner_id: order.delivery_partner_id,
            rating,
            review_text: review_text || '',
        });

        // Recalculate delivery partner's average rating
        const partnerReviews = await Review.find({ delivery_partner_id: order.delivery_partner_id });
        const avgRating =
            partnerReviews.reduce((sum, r) => sum + r.rating, 0) / partnerReviews.length;

        await User.findByIdAndUpdate(order.delivery_partner_id, {
            rating: Math.round(avgRating * 10) / 10,
        });

        res.status(201).json({ review, message: 'Review submitted successfully' });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ message: 'Server error submitting review' });
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
