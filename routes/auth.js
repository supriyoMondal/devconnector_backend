const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserToken = require('../models/UserToken');
const auth = require('../middlewares/auth');

//get user details 
//route -post  auth/
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        return res.json(user);
    } catch (err) {
        console.log(err);
        return res.status(500).send("Server Error")
    }
})

//login user
//route -post auth/
router.post('/',
    [
        check('email', "Please include a valid email").isEmail(),
        check('password', 'Password id required').exists()
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        };
        const { email, password } = req.body;
        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(403).json({ errors: [{ msg: "Invalid Credentials" }] })
            }
            const payload = {
                user: {
                    id: user.id
                }
            };
            jwt.sign(payload,
                process.env.JWT_SECRET,
                { expiresIn: 36000 },
                (error, token) => {
                    if (error) throw error;
                    return res.json({ token })
                }
            )
        } catch (err) {
            console.log(err.message);
            return res.status(500).send("Server Error");
        }
    })

module.exports = router;