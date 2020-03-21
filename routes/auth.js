const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserToken = require('../models/UserToken');
const auth = require('../middlewares/auth');
const { transporter } = require('../nodemailer_config/nodemailer_config')
const crypto = require('crypto');
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

            if (!user.emailVerified) {
                let userToken = new UserToken({
                    userId: user.id,
                    token: crypto.randomBytes(16).toString('hex')
                });
                await userToken.save();
                let link = `http://${req.headers.host}/user/confirmation/${userToken.token}`;
                let mailOptions = {
                    form: "no-reply@devconnector.com",
                    to: user.email,
                    subject: 'Account Verification Token',
                    // text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + userToken.token + '.\n',
                    html: `Hello,<br> Please Click on the link to verify your email.<br><a href=${link} target="_blank">Click here to verify</a>
                    <br>
                    <p> If You Have not tried to Sign Up to Dev-connecters ,Please Ignore this message.<p/>`
                };
                await transporter.sendMail(mailOptions);
                return res.status(403).json({ msg: "Email not verified We have send a verification link to your account." })
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