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
    }
}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
