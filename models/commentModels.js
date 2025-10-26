const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    appId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    repliesCount: {
        type: Number,
        default: 0
    },
    blocked: {
        type: Boolean,
        default: false
    },
    // 🔥 NOTIFICATION TRACKING
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    // 🔥 NEW: ADMIN READ STATUS
    adminRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better performance on notification queries
commentSchema.index({ parentId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, isDeleted: 1 });
commentSchema.index({ adminRead: 1, createdAt: -1 }); // For admin queries

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;