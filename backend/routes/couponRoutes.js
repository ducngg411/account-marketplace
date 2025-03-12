const express = require('express');
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, couponController.createCoupon);
router.delete('/:code', authMiddleware, couponController.deleteCoupon);
router.get('/', authMiddleware, couponController.getAllCoupons); 

module.exports = router;