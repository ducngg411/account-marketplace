const express = require("express");
const { body } = require("express-validator");
const moment = require("moment");
const authController = require("../controllers/authController");

const router = express.Router();

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
], authController.registerUser);

// Login
router.post('/login', authController.loginUser);

module.exports = router;