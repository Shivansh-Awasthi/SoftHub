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
        default: ''
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'discord'],
        default: 'local'
    },
    providerId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);
module.exports = User;