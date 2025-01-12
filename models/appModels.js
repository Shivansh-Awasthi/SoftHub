const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true,
        text: true,
    },
    description: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ['PC', 'Mac', 'Android', 'Playstation'],
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
    downloadLink: [{
        type: String,
        required: true
    }],
    size: {
        type: String,
        required: true
    },
    coverImg: {
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
    announcement: [{
        type: String
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

// Creating index explicitly for title
appSchema.index({ title: 'text' }); // Ensure text indexing is created

module.exports = mongoose.model('App', appSchema);