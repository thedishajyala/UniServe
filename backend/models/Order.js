const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        delivery_partner_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        requested_partner_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        // Pickup
        pickup_type: {
            type: String,
            enum: ['outlet', 'gate', 'manual'],
            required: true,
        },
        pickup_location: {
            type: String,
            required: true,
            // e.g. "Dominos", "Gate 1", "Near Library"
        },

        // Delivery
        delivery_hostel: {
            type: String,
            required: true,
        },
        delivery_room: {
            type: String,
            required: true,
        },

        // Order Details
        is_prepaid: {
            type: Boolean,
            default: false,
        },
        item_details: {
            type: String,
            required: true,
        },
        special_instructions: {
            type: String,
            default: '',
        },

        // Pricing
        price: {
            type: Number,
            required: true,
        },
        commission: {
            type: Number,
            required: true,
        },
        delivery_earning: {
            type: Number,
            required: true,
        },

        // Status
        status: {
            type: String,
            enum: ['pending', 'requested', 'accepted', 'picked', 'on_the_way', 'delivered', 'cancelled'],
            default: 'pending',
        },
        payment_status: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },

        // Timestamps for analytics
        accepted_at: Date,
        picked_at: Date,
        delivered_at: Date,

        // For AI: actual response time of partner
        response_time: {
            type: Number, // minutes from offer to accept
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
