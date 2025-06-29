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
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: ['PC', 'Mac', 'Android', 'Playstation'],
        required: true
    },
    // New: Architecture type
    architecture: {
        type: String,
        enum: ['Native', 'ARM', 'Wineskin', 'Port'],
        default: 'Native',
        required: true
    },
    // New: Tags for categorization
    tags: [{
        type: String,
        index: true,
        validate: {
            validator: function (tags) {
                return tags.length <= 15; // Limit to 15 tags
            },
            message: 'Cannot have more than 15 tags'
        }
    }],
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
    },
    thumbnail: [{
        type: String,
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
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
    }],
    // New: System requirements
    systemRequirements: {
        os: {
            type: String,
            default: 'Windows 10'
        },
        processor: {
            type: String,
            default: ''
        },
        memory: {
            type: String, // e.g., "8 GB RAM"
            default: ''
        },
        graphics: {
            type: String,
            default: ''
        },
        storage: {
            type: String, // e.g., "20 GB available space"
            default: ''
        },
        additionalNotes: {
            type: String,
            default: ''
        }
    },
    // New: Popularity tracking
    popularity: {
        dailyViews: {
            type: Number,
            default: 0
        },
        weeklyViews: {
            type: Number,
            default: 0
        },
        monthlyViews: {
            type: Number,
            default: 0
        },
        totalDownloads: {
            type: Number,
            default: 0
        },
        lastViewed: {
            type: Date,
            default: Date.now
        }
    },
    // New: Sorting metrics
    sortMetrics: {
        relevanceScore: {
            type: Number,
            default: 0
        },
        sizeValue: { // Numeric value for size in MB/GB
            type: Number,
            default: 0
        },
        releaseDate: {
            type: Date,
            default: Date.now
        }
    },
    // --- NEW FIELDS ---
    releaseYear: {
        type: Number,
        required: false
    },
    gameMode: {
        type: String,
        enum: ['Singleplayer', 'Multiplayer'],
        default: 'Singleplayer',
        required: false
    }
}, {
    timestamps: true
});

// Indexes for faster querying
appSchema.index({ title: 'text' });
appSchema.index({ tags: 1 });
appSchema.index({ 'popularity.weeklyViews': -1 });
appSchema.index({ 'sortMetrics.releaseDate': -1 });
appSchema.index({ 'sortMetrics.sizeValue': 1 });

// Middleware to convert size to numeric value before saving
appSchema.pre('save', function (next) {
    if (this.isModified('size')) {
        // Convert size string to numeric MB/GB value
        const sizeStr = this.size.toLowerCase();
        let sizeValue = 0;

        if (sizeStr.includes('gb')) {
            const gbValue = parseFloat(sizeStr);
            sizeValue = isNaN(gbValue) ? 0 : gbValue * 1024; // Convert GB to MB
        } else if (sizeStr.includes('mb')) {
            const mbValue = parseFloat(sizeStr);
            sizeValue = isNaN(mbValue) ? 0 : mbValue;
        }

        this.sortMetrics.sizeValue = sizeValue;
    }
    next();
});

// Static method for updating popularity
appSchema.statics.updatePopularity = async function (appId) {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    await this.findByIdAndUpdate(appId, {
        $inc: {
            'popularity.dailyViews': 1,
            'popularity.weeklyViews': 1,
            'popularity.monthlyViews': 1,
            'popularity.totalViews': 1
        },
        $set: { 'popularity.lastViewed': now }
    });

    // Reset daily views at midnight
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        await this.updateMany({}, {
            $set: { 'popularity.dailyViews': 0 }
        });
    }
};

module.exports = mongoose.model('App', appSchema);