const express = require('express');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/demand
// Returns peak hours, popular outlets, busy hostels for demand prediction
router.get('/demand', protect, async (req, res) => {
    try {
        // Get all delivered orders from the past 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const orders = await Order.find({
            status: 'delivered',
            createdAt: { $gte: thirtyDaysAgo },
        });

        // Peak hours (0–23)
        const hourCounts = Array(24).fill(0);
        orders.forEach((o) => {
            const hour = new Date(o.createdAt).getHours();
            hourCounts[hour]++;
        });

        const peakHours = hourCounts
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Popular outlets
        const outletMap = {};
        orders.forEach((o) => {
            if (o.pickup_type === 'outlet') {
                outletMap[o.pickup_location] = (outletMap[o.pickup_location] || 0) + 1;
            }
        });
        const popularOutlets = Object.entries(outletMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Busy delivery hostels
        const hostelMap = {};
        orders.forEach((o) => {
            hostelMap[o.delivery_hostel] = (hostelMap[o.delivery_hostel] || 0) + 1;
        });
        const busyHostels = Object.entries(hostelMap)
            .map(([hostel, count]) => ({ hostel, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Is it peak time right now?
        const currentHour = new Date().getHours();
        const currentCount = hourCounts[currentHour];
        const avgCount = hourCounts.reduce((s, c) => s + c, 0) / 24;
        const isCurrentlyPeak = currentCount > avgCount * 1.5;

        res.json({
            peakHours,
            popularOutlets,
            busyHostels,
            isCurrentlyPeak,
            demandMessage: isCurrentlyPeak
                ? '🔥 High demand right now! Go online to earn more 💸'
                : '📊 Moderate demand. A good time to start delivering!',
            totalOrdersAnalyzed: orders.length,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
});

module.exports = router;
