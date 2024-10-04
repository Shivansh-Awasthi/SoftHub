const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        required: true
    },
},
    {
        timestamps: true
    });

module.exports = mongoose.model('Order', orderSchema);