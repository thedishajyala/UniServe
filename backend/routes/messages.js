const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config — store to disk, limit 10MB, images only
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|webm|mp3|ogg|wav|m4a/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowed.test(file.mimetype);
        if (extOk || mimeOk) return cb(null, true);
        cb(new Error('File type not allowed'));
    },
});

// POST /api/messages/upload — upload image and save as message
router.post('/upload', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

        const { order_id } = req.body;
        if (!order_id) return res.status(400).json({ message: 'order_id is required' });

        const imageUrl = `/uploads/${req.file.filename}`;

        const message = await Message.create({
            order_id,
            sender_id: req.user._id,
            type: 'image',
            content: '',
            image_url: imageUrl,
        });

        res.status(201).json({
            message: {
                _id: message._id,
                order_id,
                sender_id: req.user._id,
                type: 'image',
                image_url: imageUrl,
                content: '',
                createdAt: message.createdAt,
            },
        });
    } catch (err) {
        console.error('Image upload error:', err);
        res.status(500).json({ message: err.message || 'Upload failed' });
    }
});

// POST /api/messages/upload-voice — upload audio and save as message
router.post('/upload-voice', protect, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No audio uploaded' });

        const { order_id } = req.body;
        if (!order_id) return res.status(400).json({ message: 'order_id is required' });

        const voiceUrl = `/uploads/${req.file.filename}`;

        const message = await Message.create({
            order_id,
            sender_id: req.user._id,
            type: 'voice',
            content: '',
            voice_url: voiceUrl,
        });

        res.status(201).json({
            message: {
                _id: message._id,
                order_id,
                sender_id: req.user._id,
                type: 'voice',
                voice_url: voiceUrl,
                content: '',
                createdAt: message.createdAt,
            },
        });
    } catch (err) {
        console.error('Voice upload error:', err);
        res.status(500).json({ message: err.message || 'Voice upload failed' });
    }
});

// GET /api/messages/order/:orderId — fetch all messages for an order
router.get('/order/:orderId', protect, async (req, res) => {
    try {
        const messages = await Message.find({ order_id: req.params.orderId })
            .sort({ createdAt: 1 })
            .lean();
        res.json(messages);
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
