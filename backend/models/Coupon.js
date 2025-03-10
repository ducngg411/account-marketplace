const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    expirationDate: { type: Date, required: true },
    maxUses: { type: Number, required: true },
    usedCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);