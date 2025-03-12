const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
    const products = await Product.find();
    res.json(products);
};

exports.createProduct = async (req, res) => {
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
};

exports.updateProduct = async (req, res) => {
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
};

exports.deleteProduct = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to delete products!" });
    }

    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found!" });

    res.json({ message: "Product deleted successfully!" });
};

exports.createProductReview = async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found!" });

    const alreadyReviewed = product.reviews.find(review => review.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ message: "Product already reviewed!" });

    const review = { name: req.user.fullName, rating: Number(rating), comment, user: req.user._id };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.json({ message: "Review added successfully!" });
};

exports.deleteProductReview = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found!" });

    const review = product.reviews.find(review => review._id.toString() === req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found!" });

    const removeIndex = product.reviews.map(review => review._id.toString()).indexOf(req.params.reviewId);
    product.reviews.splice(removeIndex, 1);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews;

    await product.save();
    res.json({ message: "Review deleted successfully!" });
}

exports.updateProductReview = async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found!" });

    const review = product.reviews.find(r => r.user.toString() === req.user.id);
    if (!review) return res.status(404).json({ message: "Review not found!" });

    review.rating = Number(rating);
    review.comment = comment;

    product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.json({ message: "Review updated successfully!" });
};

exports.addProductAccounts = async (req, res) => {
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
};