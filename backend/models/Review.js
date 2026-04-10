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
        reviewee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // 'partner' | 'requester' — who was on the RECEIVING end of this review
        reviewee_role: {
            type: String,
            enum: ['partner', 'requester'],
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

// Compound index to ensure one user can only review another user ONCE per order
reviewSchema.index({ order_id: 1, reviewer_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
