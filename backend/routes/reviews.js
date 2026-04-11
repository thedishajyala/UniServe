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
            return res.status(400).json({ message: 'Rating and order ID are required' });
        }

        const order = await Order.findById(order_id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Order must be delivered before reviewing' });
        }

        // Identify roles
        const isRequester = order.user_id.toString() === req.user._id.toString();
        const isPartner = order.delivery_partner_id?.toString() === req.user._id.toString();

        if (!isRequester && !isPartner) {
            return res.status(403).json({ message: 'You were not involved in this order' });
        }

        // Determine reviewee
        const reviewee_id = isRequester ? order.delivery_partner_id : order.user_id;
        const reviewee_role = isRequester ? 'partner' : 'requester';

        if (!reviewee_id) {
            return res.status(400).json({ message: 'No one to review' });
        }

        // Prevent duplicate reviews FROM THIS REVIEWER for THIS ORDER
        const existing = await Review.findOne({ order_id, reviewer_id: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'You have already reviewed this order' });
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

        res.status(201).json({ review, message: 'Review submitted! ✅' });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ message: 'Server error while submitting review' });
    }
});

// POST /api/reviews/:reviewId/reply
router.post('/:reviewId/reply', protect, async (req, res) => {
    try {
        const { reply_text } = req.body;
        if (!reply_text) return res.status(400).json({ message: 'Reply text is required' });

        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        // Only the person being reviewed (reviewee) can reply
        if (review.reviewee_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the recipient of the review can reply' });
        }

        review.reply_text = reply_text;
        review.replied_at = new Date();
        await review.save();

        res.json({ review, message: 'Reply submitted! 💬' });
    } catch (error) {
        console.error('Reply error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/reviews/partner/:partnerId
router.get('/partner/:partnerId', async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee_id: req.params.partnerId })
            .populate('reviewer_id', 'name hostel')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
