const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const UNIVERSITY_DOMAIN = process.env.UNIVERSITY_EMAIL_DOMAIN || 'bennett.edu.in';

function generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, enrollment_no, hostel, room_no } = req.body;

        // Validate university email
        if (!email.toLowerCase().endsWith(`@${UNIVERSITY_DOMAIN}`)) {
            return res.status(400).json({
                message: `Only university email addresses (@${UNIVERSITY_DOMAIN}) are allowed`,
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { enrollment_no }] });
        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ message: 'An account with this email already exists' });
            }
            return res.status(400).json({ message: 'Enrollment number already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            enrollment_no,
            hostel,
            room_no,
            profile_complete: !!(name && enrollment_no && hostel && room_no),
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            enrollment_no: user.enrollment_no,
            hostel: user.hostel,
            room_no: user.room_no,
            profile_complete: user.profile_complete,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            enrollment_no: user.enrollment_no,
            hostel: user.hostel,
            room_no: user.room_no,
            rating: user.rating,
            total_deliveries: user.total_deliveries,
            is_available: user.is_available,
            profile_complete: user.profile_complete,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;
