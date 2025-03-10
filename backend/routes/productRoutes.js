const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

router.post('/', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to add products!" });
    }

    const { name, price, stock, description, image, category, brand } = req.body;
    const newProduct = new Product({
        name, price, stock, description, image, category, brand,
        rating: 0, numReviews: 0, reviews: []
    });

    await newProduct.save();
    res.json({ message: "Product added successfully!" });
});

router.put('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to edit products!" });
    }

    const { name, price, stock, description, image, category, brand } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, 
        { name, price, stock, description, image, category, brand },
        { new: true }
    );

    if (!updatedProduct) return res.status(404).json({ message: "Product not found!" });

    res.json({ message: "Product updated successfully!", product: updatedProduct });
});

router.delete('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to delete products!" });
    }

    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found!" });

    res.json({ message: "Product deleted successfully!" });
});

router.post('/:id/reviews', authMiddleware, async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found!" });

    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user.id);
    if (alreadyReviewed) return res.status(400).json({ message: "You have already reviewed this product!" });

    const review = {
        user: req.user.id,
        name: req.user.username,
        rating: Number(rating),
        comment
    };
    product.reviews.push(review);

    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews;

    await product.save();
    res.json({ message: "Review added successfully!" });
});

router.delete('/:id/reviews', authMiddleware, async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found!" });

    const review = product.reviews.find(r => r.user.toString() === req.user.id);
    if (!review) return res.status(404).json({ message: "Review not found!" });

    product.reviews = product.reviews.filter(r => r.user.toString() !== req.user.id);

    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews;

    await product.save();
    res.json({ message: "Review deleted successfully!" });
});

router.put('/:id/reviews', authMiddleware, async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found!" });

    const review = product.reviews.find(r => r.user.toString() === req.user.id);
    if (!review) return res.status(404).json({ message: "Review not found!" });

    review.rating = Number(rating);
    review.comment = comment;

    product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews;

    await product.save();
    res.json({ message: "Review updated successfully!" });
});

router.post('/:id/accounts', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to add accounts!" });
        }

        const { accounts } = req.body;

        if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
            return res.status(400).json({ message: "Invalid accounts data!" });
        }

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found!" });

        product.accounts = [...product.accounts, ...accounts];

        product.stock = product.accounts.length;
        await product.save();

        res.status(200).json({ message: "Accounts added successfully!", product });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error!" });        
    }
});

module.exports = router;
