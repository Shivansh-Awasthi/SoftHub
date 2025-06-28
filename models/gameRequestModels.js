const mongoose = require('mongoose');

const gameRequestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Game title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
        text: true,
        unique: true,
        uniqueCaseInsensitive: true
    },
    description: {
        type: String,
        trim: true,
        default: `Your favourite game Request`,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    platform: {
        type: String,
        enum: ['PC', 'Mac', 'Android', 'iOS', 'Playstation', 'Xbox', 'Switch'],
        required: [true, 'Platform is required']
    },
    steamLink: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return /^https:\/\/store\.steampowered\.com\/app\/\d+\/[a-zA-Z0-9_]+[\/]?$/.test(v);
            },
            message: props => `${props.value} is not a valid Steam URL!`
        },
        default: null
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'approved', 'rejected', 'deleted'],
        default: 'pending'
    },
    votes: {
        type: Number,
        default: 0
    },
    voters: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        ipAddress: String,
        votedAt: {
            type: Date,
            default: Date.now
        }
    }],
    ipAddress: {
        type: String,
        select: false
    },
    userAgent: {
        type: String,
        select: false
    },
    lastVotedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
gameRequestSchema.index({ title: 'text', description: 'text' });
gameRequestSchema.index({ status: 1, votes: -1 });
gameRequestSchema.index({ 'voters.ipAddress': 1, 'voters.user': 1 });

// Virtuals
gameRequestSchema.virtual('requester', {
    ref: 'User',
    localField: 'requestedBy',
    foreignField: '_id',
    justOne: true
});

gameRequestSchema.virtual('steamAppId').get(function () {
    if (!this.steamLink) return null;
    const matches = this.steamLink.match(/app\/(\d+)/);
    return matches ? matches[1] : null;
});

// Middleware to prevent duplicates
gameRequestSchema.pre('save', async function (next) {
    const existing = await this.constructor.findOne({
        title: { $regex: new RegExp(`^${this.title}$`, 'i') },
        platform: this.platform
    });

    if (existing && !existing._id.equals(this._id)) {
        const err = new Error('This game already exists for this platform');
        err.name = 'DuplicateGameError';
        err.status = 409;
        return next(err);
    }
    next();
});

const GameRequest = mongoose.model('GameRequest', gameRequestSchema);
module.exports = GameRequest;