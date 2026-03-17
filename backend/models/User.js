const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    enrollment_no: {
      type: String,
      required: [true, 'Enrollment number is required'],
      unique: true,
      trim: true,
    },
    hostel: {
      type: String,
      required: [true, 'Hostel is required'],
      // Boys: C1-C15, Girls: D1-D6
    },
    room_no: {
      type: String,
      required: [true, 'Room number is required'],
    },
    profile_complete: {
      type: Boolean,
      default: false,
    },

    // Delivery Partner Stats
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    total_deliveries: {
      type: Number,
      default: 0,
    },
    successful_deliveries: {
      type: Number,
      default: 0,
    },
    avg_response_time: {
      type: Number, // in minutes
      default: 5,
    },
    total_earnings: {
      type: Number,
      default: 0,
    },
    today_earnings: {
      type: Number,
      default: 0,
    },

    // Availability
    is_available: {
      type: Boolean,
      default: false,
    },

    last_active: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
