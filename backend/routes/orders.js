const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { calculatePricing, validateGate3IsParcel } = require('../services/pricingEngine');
const { rankPartners } = require('../services/matchingEngine');

const router = express.Router();

// POST /api/orders/create
router.post('/create', protect, async (req, res) => {
    try {
        const {
            pickup_type,
            pickup_location,
            delivery_hostel,
            delivery_room,
            item_details,
            special_instructions,
        } = req.body;

        if (!pickup_type || !pickup_location || !delivery_hostel || !delivery_room || !item_details) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Gate 3 parcel validation
        const { parcelOnly } = validateGate3IsParcel(pickup_location, item_details);

        // Calculate pricing
        const { price, commission, delivery_earning } = calculatePricing(pickup_type, pickup_location);

        const order = await Order.create({
            user_id: req.user._id,
            pickup_type,
            pickup_location,
            delivery_hostel,
            delivery_room,
            item_details,
            special_instructions: special_instructions || '',
            price,
            commission,
            delivery_earning,
            payment_status: 'paid', // Prepaid — mark as paid immediately
            status: 'pending',
        });

        await order.populate('user_id', 'name email hostel room_no enrollment_no');

        res.status(201).json({ order, parcelOnly });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Server error while creating order' });
    }
});

// GET /api/orders/partners/:orderId  — AI-ranked available partners
router.get('/partners/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Don't show the order creator as a partner
        const availablePartners = await User.find({
            is_available: true,
            profile_complete: true,
            _id: { $ne: req.user._id },
        }).select('-password');

        const ranked = rankPartners(availablePartners, order.delivery_hostel);

        res.json({ partners: ranked, count: ranked.length });
    } catch (error) {
        console.error('Fetch partners error:', error);
        res.status(500).json({ message: 'Server error fetching partners' });
    }
});

// POST /api/orders/assign — Assign a delivery partner
router.post('/assign', protect, async (req, res) => {
    try {
        const { order_id, partner_id } = req.body;

        const order = await Order.findById(order_id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (order.delivery_partner_id) {
            return res.status(400).json({ message: 'Order already has a delivery partner' });
        }

        const partner = await User.findById(partner_id);
        if (!partner || !partner.is_available) {
            return res.status(400).json({ message: 'Partner not available' });
        }

        order.delivery_partner_id = partner_id;
        order.status = 'accepted';
        order.accepted_at = new Date();
        await order.save();

        await order.populate(['user_id', 'delivery_partner_id'], 'name email hostel room_no enrollment_no');

        res.json({ order, message: 'Partner assigned successfully' });
    } catch (error) {
        console.error('Assign partner error:', error);
        res.status(500).json({ message: 'Server error assigning partner' });
    }
});

// POST /api/orders/status — Update order status
router.post('/status', protect, async (req, res) => {
    try {
        const { order_id, status } = req.body;

        const validStatuses = ['accepted', 'picked', 'on_the_way', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findById(order_id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Only delivery partner or order owner can update status
        const isPartner = order.delivery_partner_id?.toString() === req.user._id.toString();
        const isOwner = order.user_id.toString() === req.user._id.toString();

        if (!isPartner && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        order.status = status;

        if (status === 'picked') order.picked_at = new Date();
        if (status === 'delivered') {
            order.delivered_at = new Date();

            // Calculate response time and update partner stats
            if (order.delivery_partner_id) {
                const partner = await User.findById(order.delivery_partner_id);
                if (partner) {
                    partner.total_deliveries += 1;
                    partner.successful_deliveries += 1;
                    partner.total_earnings += order.delivery_earning;

                    // Update avg response time
                    if (order.accepted_at && order.created_at) {
                        const responseMin = (order.accepted_at - order.created_at) / 60000;
                        const total = partner.total_deliveries;
                        partner.avg_response_time =
                            (partner.avg_response_time * (total - 1) + responseMin) / total;
                    }
                    await partner.save();
                }
            }
        }

        await order.save();
        await order.populate(['user_id', 'delivery_partner_id'], 'name email hostel room_no enrollment_no rating');

        res.json({ order, message: `Order status updated to ${status}` });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error updating status' });
    }
});

// GET /api/orders/my-orders — Requester's order history
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user_id: req.user._id })
            .populate('delivery_partner_id', 'name email hostel room_no rating enrollment_no')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/orders/my-deliveries — Delivery partner's history
router.get('/my-deliveries', protect, async (req, res) => {
    try {
        const deliveries = await Order.find({ delivery_partner_id: req.user._id })
            .populate('user_id', 'name email hostel room_no enrollment_no')
            .sort({ createdAt: -1 });
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/orders/:orderId — Single order detail
router.get('/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user_id', 'name email hostel room_no enrollment_no')
            .populate('delivery_partner_id', 'name email hostel room_no rating enrollment_no');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isInvolved =
            order.user_id._id.toString() === req.user._id.toString() ||
            order.delivery_partner_id?._id?.toString() === req.user._id.toString();

        if (!isInvolved) return res.status(403).json({ message: 'Not authorized' });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
