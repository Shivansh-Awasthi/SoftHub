const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameRequest',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    // Auto-delete votes after 24 hours
    expires: 24 * 60 * 60
});

// Prevent duplicate votes
voteSchema.index({ request: 1, user: 1 }, { unique: true });
voteSchema.index({ request: 1, ipAddress: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);
module.exports = Vote;