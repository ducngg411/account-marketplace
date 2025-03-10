const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true }
}, { _id: false });

const OrderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    accounts: [AccountSchema] 
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    items: [OrderItemSchema], 
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'canceled'],
        default: 'pending'
    },
    paymentExpiresAt: { type: Date, default: () => new Date(Date.now() + 15 * 60000) },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);