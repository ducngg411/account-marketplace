const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
});

const ReviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    comment: { type: String, required: true }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    brand: { type: String, required: true },
    accounts: [AccountSchema],
    reviews: [ReviewSchema]
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
