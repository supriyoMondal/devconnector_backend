const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserToken = require('../models/UserToken');
//Post Route To Register a User
// route - user/

router.post("/", [
    check('name', 'Name is Required').not().isEmpty(),
    check('email', "Please include a valid email").isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: "User Already Exists" }] })
        }
        user = new User({
            name, email, password
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = {
            user: {
                id: user.id
            }
        };
        jwt.sign(payload,
            process.env.JWT_SECRET,
            { expiresIn: 36000 },
            (err, token) => {
                if (err) throw err;
                return res.json({ token });
            }
        );
    } catch (err) {
        console.log(err.message);
        return res.send("Server Error");
    }
});

module.exports = router;