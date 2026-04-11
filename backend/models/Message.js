const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // type: 'text' | 'image' | 'location' | 'voice'
        type: {
            type: String,
            enum: ['text', 'image', 'location', 'voice'],
            default: 'text',
        },
        content: {
            type: String,
            default: '',
            maxlength: 2000,
        },
        image_url: {
            type: String,
            default: null,
        },
        voice_url: {
            type: String,
            default: null,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
