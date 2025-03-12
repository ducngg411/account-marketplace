const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', productController.getAllProducts);
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
router.post('/:id/reviews', authMiddleware, productController.createProductReview);
router.delete('/:id/reviews', authMiddleware, productController.deleteProductReview);
router.put('/:id/reviews', authMiddleware, productController.updateProductReview);
router.post('/:id/accounts', authMiddleware, productController.addProductAccounts);

module.exports = router;
