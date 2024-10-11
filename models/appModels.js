const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ['PC', 'Mac', 'Android', 'PS4'],
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 0
    },
    downloadLink: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    thumbnail: [{
        type: String,  // Cloudinary URL for thumbnail
        required: true
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    gameplayVideos: [{
        type: String  // Cloudinary URLs for gameplay videos
    }],
    reviews: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String,
        rating: {
            type: Number,
            min: 1, max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
    }],
}, {
    timestamps: true
}
);

module.exports = mongoose.model('App', appSchema);