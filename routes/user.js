const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserToken = require('../models/UserToken');
const crypto = require('crypto');
// const nodemailer = require('nodemailer');
const { transporter } = require('../nodemailer_config/nodemailer_config')
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
            <p> If You Have not tried to Sign Up to Dev-connecters ,Please Ignore this message.
            <p/>`
        };
        await transporter.sendMail(mailOptions);
        jwt.sign(payload,
            process.env.JWT_SECRET,
            { expiresIn: 36000 },
            (err, token) => {
                if (err) throw err;
                return res.json({ token, msg: `A verification email has been sent to ${user.email}` });
            }
        );
    } catch (err) {
        console.log(err.message);
        return res.status(500).send(err.message);
    }
});

router.get('/confirmation/:token', async (req, res) => {
    const token = req.params.token;
    // console.log(token);
    try {
        let userToken = await UserToken.findOne({ token });
        if (!userToken) {
            return res.render('v-failed', { msg: "Token may have expired" });
        }
        let userId = userToken.userId;
        let user = await User.findById(userId);
        if (!user) {
            return res.render('v-failed', { msg: "User not found" })
        }
        if (user.emailVerified) {
            await userToken.remove();
            return res.render('success', { msg: "Email Already Verified" });
        }
        user.emailVerified = true;
        await user.save();
        await userToken.remove();
        return res.render('success', { msg: "" })

    } catch (err) {
        console.log(err.message);
        return res.render('v-failed', { msg: "" });
    }
})


module.exports = router;