const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        // Not required for OAuth users
    },
    role: {
        type: String,
        default: 'user'
    },
    purchasedGames: {
        type: [String],
        default: [],
    },
    avatar: {
        type: String,
        default: 'https://i.pinimg.com/236x/4e/a4/60/4ea4602026ae60b8d0774cfabd0bb6ce.jpg'
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'discord'],
        default: 'local'
    },
    providerId: {
        type: String,
        default: null
    },
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add a method to check if user is admin or moderator
userSchema.methods.isModOrAdmin = function () {
    return this.role === 'admin' || this.role === 'moderator' || this.role === 'mod';
};

const User = mongoose.model("User", userSchema);
module.exports = User;