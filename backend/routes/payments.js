const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/key', (req, res) => {
    // If no keys exist, we instruct the frontend to bypass payments for now
    if (!process.env.RAZORPAY_KEY_ID) {
        return res.json({ bypass: true, key: null });
    }
    res.json({ bypass: false, key: process.env.RAZORPAY_KEY_ID });
});

router.post('/create-order', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ message: 'Razorpay keys not configured in .env' });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount * 100, // Razorpay works in smallest currency unit (paise)
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${req.user._id}`,
        };

        const order = await instance.orders.create(options);
        if (!order) return res.status(500).json({ message: 'Failed to initialize payment gateway' });

        res.json(order);
    } catch (error) {
        console.error('Razorpay Error:', error);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
});

router.post('/verify', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Find user and add 5 delivery passes
            const User = require('../models/User'); // lazy load to avoid ref issues
            await User.findByIdAndUpdate(req.user._id, { $inc: { delivery_passes: 5 } });
            
            res.json({ success: true, message: 'Payment successfully verified! 5 Passes added.' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
});

module.exports = router;
