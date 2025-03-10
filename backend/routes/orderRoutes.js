const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { items, couponCode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Cart cannot be empty" });
        }

        let totalPrice = 0;
        let updatedItems = [];

        for (let item of items) {
            const product = await Product.findById(item.product);
            if (!product || product.accounts.length < item.quantity) {
                return res.status(400).json({ message: `Product ${item.name} is out of stock` });
            }

            const assignedAccounts = product.accounts.splice(0, item.quantity).map(acc => 
                ({ email: acc.email, 
                    password: acc.password })
            );
            
            await product.save();
            
            product.stock = product.stock - item.quantity;

            const updatedItem = {
                product: item.product,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                accounts: assignedAccounts
            };
            
            updatedItems.push(updatedItem);
            totalPrice += product.price * item.quantity;
        }

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (!coupon) {
                return res.status(400).json({ message: "Invalid coupon code" });
            }

            if (coupon.expirationsDate < new Date()) {
                return res.status(400).json({ message: "Coupon has expired" });
            }

            if (coupon.usedCount >= coupon.maxUses) {
                return res.status(400).json({ message: "Coupon has reached maximum usage" });
            }

            if (coupon.discountType === "percentage") {
                totalPrice = Math.max(0, totalPrice - (totalPrice * coupon.discountValue / 100)); // prevent negative total price
            } else if (coupon.discountType === "fixed") {
                totalPrice = Math.max(0, totalPrice - coupon.discountValue); // prevent negative total price
            }

            coupon.usedCount += 1;
            await coupon.save();
        }

        const userId = req.user.id;

        const newOrder = new Order({
            user: userId,
            items: updatedItems,
            totalPrice,
            status: 'pending'
        });

        await newOrder.save();

        for (let item of items) {
            await Product.findByIdAndUpdate(item.product, { $inc: {stock: -item.quantity } });
        }
        res.json({ message: "Order created successfully", order: newOrder });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "You don't have permission to view orders" });
        }

        const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'fullname email'); // sort by newest
        res.json(orders);
    } catch (error) {
        console.error("Failed to get orders", error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "You don't have permission to update orders" });
        }

        const { status } = req.body;
        const allowedStatus = ["pending", "completed", "cancelled"];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
    
        res.json({ message: "Order status updated", order: updatedOrder });
    } catch (error) {
        console.error("Failed to update order status", error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.put("/:id/pay", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status !== "pending") {
            return res.status(400).json({ message: "Order is not pending" });
        }

        order.status = "completed";
        await order.save();

        res.json({
            message: "Order paid successfully! Thank you for your purchase. Here are your accounts",
            order: {
                id: order._id,
                status: order.status,
                items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    accounts: item.accounts
                })),
                totalPrice: order.totalPrice
            }
        })
    } 
    catch (error) {
        console.error("Failed to pay order", error);
        res.status(500).json({ message: "Server Error" });
    }
});

 router.put('/check-expired-orders', async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "You don't have permission to check expired orders" });
        }

        const now = new Date();
        const expiredOrders = await Order.find({ status: "pending", paymentExpiresAt: { $lt: now } });
        
        for (let order of expiredOrders) {
            order.status = "cancelled";

            for (let item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.accounts = [...product.accounts, ...item.accounts];
                    product.stock += item.quantity;
                    await product.save();
                }
            }
            await order.save();
        }

        res.json({ message: `${expiredOrders.length} order was canceled due to overdue payment!` });
    } catch (error) {
        console.error("Failed to check expired order", error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get('/my-orders', authMiddleware, async (req, res) => {
    try {
        const order = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }); // sort by newest

        res.json(order.map(order => ({
            _id: order._id,
            status: order.status,
            totalPrice: order.totalPrice,
            createdAt: order.createdAt,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                accounts: order.status === "completed" ? item.accounts : [] // only show accounts if order is completed
            }))
        })));
    } catch (error) {
        console.error("Failed to get orders", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;