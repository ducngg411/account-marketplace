const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post('/', authMiddleware, orderController.createOrder);
router.get('/', authMiddleware, orderController.getAllOrders);
router.get('/:id/status', authMiddleware, orderController.updateOrderStatus);
router.put("/:id/pay", authMiddleware, orderController.payOrder);
router.put('/check-expired-orders', authMiddleware, orderController.checkExpiredOrders);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);

module.exports = router;