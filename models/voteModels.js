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
    timestamps: { createdAt: true, updatedAt: false }  // Only track creation time
});

// TTL index for automatic cleanup (48 hours)
voteSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });  // 48 hours in seconds

// Optimized indexes for daily vote checks
voteSchema.index({ request: 1, user: 1, createdAt: 1 });
voteSchema.index({ request: 1, ipAddress: 1, createdAt: 1 });

const Vote = mongoose.model('Vote', voteSchema);
module.exports = Vote;