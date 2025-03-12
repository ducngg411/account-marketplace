const Coupon = require('../models/Coupon');

exports.getAllCoupons = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to view coupons!" });
        }

        const coupons = await Coupon.find();
        res.json(coupons);
    } catch (error) {
        console.error("Failed to get coupons:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.createCoupon = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to add coupons!" });
        }

        const { code, discountType, discountValue, expirationDate, maxUses } = req.body;

        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) return res.status(400).json({ message: "Coupon already exist" });

        const newCoupon = new Coupon({
            code,
            discountType,
            discountValue,
            expirationDate,
            maxUses
        });

        await newCoupon.save();
        res.json({ message: "Coupon added successfully", coupon: newCoupon });
    } catch (error) {
        console.error("Error while adding coupon:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to delete coupons!" });
        }

        const deletedCoupon = await Coupon.findOneAndDelete({ code: req.params.code });
        if (!deletedCoupon) return res.status(404).json({ message: "Coupon not found!" });

        res.json({ message: "Coupon deleted successfully!" });
    } catch (error) {
        console.error("Error while deleting coupon:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};