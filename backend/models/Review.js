const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        reviewer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        delivery_partner_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        review_text: {
            type: String,
            default: '',
            maxlength: 500,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
