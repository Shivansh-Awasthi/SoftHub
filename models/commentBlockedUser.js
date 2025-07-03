const mongoose = require('mongoose');

const commentBlockedUserSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CommentBlockedUser = mongoose.model('CommentBlockedUser', commentBlockedUserSchema);
module.exports = CommentBlockedUser;
