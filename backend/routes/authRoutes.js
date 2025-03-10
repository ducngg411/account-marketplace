const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Register

router.post('/register', [
    body('fullName').notEmpty(),
    body('email').isEmail(),
    body('username').notEmpty(),
    body('password').isLength({ min: 6 }),
    body('phoneNumber').notEmpty(),
    body('birthDate').custom(value => {
        if (!moment(value, "DD/MM/YYYY", true).isValid()) {
            throw new Error('Birth date is invalid. Please use format DD/MM/YYYY');
        }
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { fullName, email, username, password, phoneNumber, birthDate } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "Username or Email already exist" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ fullName, email, username, password: hashedPassword, phoneNumber, birthDate });
    await newUser.save();

    res.json({ message: "User created successfully" });
});


// Login

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Password is incorrect" });

    const token = jwt.sign({ id: user._id, role: user.role, fullName: user.fullName, username: user.username}, process.env.JWT_SECRET, { expiresIn: '6h' });

    res.json({ 
        token, 
        role: user.role,
        fullName: user.fullName,
        username: user.username,
        extends: {
            email: user.email,
            birthDate: user.birthDate,
            phoneNumber: user.phoneNumber,
        }
    });
});

module.exports = router;