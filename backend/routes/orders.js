const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { calculatePricing, validateGate3IsParcel } = require('../services/pricingEngine');
const { rankPartners } = require('../services/matchingEngine');

const router = express.Router();

// We'll attach io from server.js
let _io;
router.setIo = (io) => { _io = io; };

// POST /api/orders/create
router.post('/create', protect, async (req, res) => {
    try {
        const { pickup_type, pickup_location, delivery_hostel, delivery_room, item_details, special_instructions, is_prepaid } = req.body;

        if (!pickup_type || !pickup_location || !delivery_hostel || !delivery_room || !item_details) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const { parcelOnly } = validateGate3IsParcel(pickup_location, item_details);
        const { price, commission, delivery_earning } = calculatePricing(pickup_type, pickup_location);

        const order = await Order.create({
            user_id: req.user._id,
            pickup_type,
            pickup_location,
            delivery_hostel,
            delivery_room,
            item_details,
            is_prepaid: is_prepaid || false,
            special_instructions: special_instructions || '',
            price,
            commission,
            delivery_earning,
            payment_status: 'paid',
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

// POST /api/orders/request — Requester sends request to a specific partner (status → requested)
router.post('/request', protect, async (req, res) => {
    try {
        const { order_id, partner_id } = req.body;

        const order = await Order.findById(order_id).populate('user_id', 'name hostel room_no enrollment_no');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.user_id._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Order already has a partner' });
        }

        const partner = await User.findById(partner_id);
        if (!partner || !partner.is_available) {
            return res.status(400).json({ message: 'Partner not available' });
        }

        order.requested_partner_id = partner_id;
        order.status = 'requested';
        await order.save();

        // Notify the partner in real-time via their personal socket room
        if (_io) {
            _io.to(`user_${partner_id}`).emit('incoming_order_request', {
                order: {
                    _id: order._id,
                    pickup_location: order.pickup_location,
                    delivery_hostel: order.delivery_hostel,
                    delivery_room: order.delivery_room,
                    item_details: order.item_details,
                    price: order.price,
                    delivery_earning: order.delivery_earning,
                },
                requester: {
                    name: req.user.name,
                    hostel: req.user.hostel,
                    room_no: req.user.room_no,
                    enrollment_no: req.user.enrollment_no,
                },
            });
        }

        res.json({ order, message: 'Request sent to partner' });
    } catch (error) {
        console.error('Request partner error:', error);
        res.status(500).json({ message: 'Server error requesting partner' });
    }
});

// POST /api/orders/respond — Partner accepts or declines
router.post('/respond', protect, async (req, res) => {
    try {
        const { order_id, response } = req.body; // response: 'accepted' | 'declined'

        if (!['accepted', 'declined'].includes(response)) {
            return res.status(400).json({ message: 'Response must be accepted or declined' });
        }

        const order = await Order.findById(order_id).populate('user_id', 'name hostel room_no enrollment_no');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.requested_partner_id?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'This request was not sent to you' });
        }
        if (order.status !== 'requested') {
            return res.status(400).json({ message: 'Order is no longer available' });
        }

        if (response === 'accepted') {
            // Check if partner has enough delivery passes
            const partner = await User.findById(req.user._id);
            if (partner.delivery_passes <= 0) {
                return res.status(403).json({ message: 'No delivery passes left. Please recharge.' });
            }

            // Deduct pass
            partner.delivery_passes -= 1;
            await partner.save();

            order.delivery_partner_id = req.user._id;
            order.status = 'accepted';
            order.accepted_at = new Date();
            order.requested_partner_id = null;
            await order.save();

            await order.populate('delivery_partner_id', 'name hostel room_no enrollment_no rating');

            // Notify requester
            if (_io) {
                _io.to(`user_${order.user_id._id}`).emit('order_request_response', {
                    order_id,
                    response: 'accepted',
                    partner: {
                        name: req.user.name,
                        hostel: req.user.hostel,
                        room_no: req.user.room_no,
                        enrollment_no: req.user.enrollment_no,
                        rating: req.user.rating,
                    },
                });
            }

            res.json({ order, message: 'Order accepted! Chat is now open.' });
        } else {
            // Declined — reset to pending so requester can pick someone else
            order.status = 'pending';
            order.requested_partner_id = null;
            await order.save();

            // Notify requester
            if (_io) {
                _io.to(`user_${order.user_id._id}`).emit('order_request_response', {
                    order_id,
                    response: 'declined',
                    partnerName: req.user.name,
                });
            }

            res.json({ order, message: 'Order declined' });
        }
    } catch (error) {
        console.error('Respond to order error:', error);
        res.status(500).json({ message: 'Server error responding to order' });
    }
});

// GET /api/orders/incoming — Partner sees orders requested to them
router.get('/incoming', protect, async (req, res) => {
    try {
        const orders = await Order.find({
            requested_partner_id: req.user._id,
            status: 'requested',
        }).populate('user_id', 'name hostel room_no enrollment_no');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/orders/status — Update order status (partner only)
router.post('/status', protect, async (req, res) => {
    try {
        const { order_id, status } = req.body;

        const validStatuses = ['picked', 'on_the_way', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findById(order_id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isPartner = order.delivery_partner_id?.toString() === req.user._id.toString();
        const isOwner = order.user_id.toString() === req.user._id.toString();

        if (!isPartner && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        order.status = status;

        if (status === 'picked') order.picked_at = new Date();
        if (status === 'delivered') {
            order.delivered_at = new Date();

            if (order.delivery_partner_id) {
                const partner = await User.findById(order.delivery_partner_id);
                if (partner) {
                    partner.total_deliveries += 1;
                    partner.successful_deliveries += 1;
                    partner.total_earnings += order.delivery_earning;

                    if (order.accepted_at) {
                        const responseMin = (order.accepted_at - order.createdAt) / 60000;
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

// POST /api/orders/cancel
router.post('/cancel', protect, async (req, res) => {
    try {
        const { order_id, reason } = req.body;
        const order = await Order.findById(order_id)
            .populate('user_id', 'name')
            .populate('delivery_partner_id', 'name');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isOwner = order.user_id._id.toString() === req.user._id.toString();
        const isPartner = order.delivery_partner_id?._id?.toString() === req.user._id.toString();

        if (!isOwner && !isPartner) return res.status(403).json({ message: 'Not authorized' });

        const cancellableStatuses = ['pending', 'requested', 'accepted'];
        if (!cancellableStatuses.includes(order.status)) {
            return res.status(400).json({ message: `Cannot cancel an order that is already "${order.status}"` });
        }

        order.status = 'cancelled';
        order.requested_partner_id = null;
        await order.save();

        // Notify the other party via socket
        if (_io) {
            const notifyUserId = isOwner
                ? order.delivery_partner_id?._id
                : order.user_id._id;
            if (notifyUserId) {
                _io.to(`user_${notifyUserId}`).emit('order_cancelled', {
                    order_id,
                    cancelled_by: req.user.name,
                    reason: reason || 'No reason given',
                });
            }
        }

        res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: 'Server error cancelling order' });
    }
});

// GET /api/orders/my-orders
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

// GET /api/orders/my-deliveries
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

// GET /api/orders/:orderId
router.get('/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user_id', 'name email hostel room_no enrollment_no')
            .populate('delivery_partner_id', 'name email hostel room_no rating enrollment_no')
            .populate('requested_partner_id', 'name hostel room_no enrollment_no');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isInvolved =
            order.user_id._id.toString() === req.user._id.toString() ||
            order.delivery_partner_id?._id?.toString() === req.user._id.toString() ||
            order.requested_partner_id?._id?.toString() === req.user._id.toString();

        if (!isInvolved) return res.status(403).json({ message: 'Not authorized' });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
