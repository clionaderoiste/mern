const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator/check');

//@route    GET api/auth
//@desc     Test route
//@access   Public
router.get('/', auth, async (req, res) => {
    try {
        //return the user by looking it up in the DB by id, minus the password
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

//@route    POST api/auth
//@desc     Authenticate user & get token
//@access   Public
router.post(
    '/',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        //if there are errors, send errors and a 400 Bad Request status
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            //See if the user exists
            //If the user doesn't exist return an opaque error
            if (!user) {
                return res.status(400).json({
                    errors: [
                        {
                            msg: 'Invalid Credentials',
                        },
                    ],
                });
            }

            //compare to see if the password is right, you pass it the plain text password and it checks it against the encrypted one in the DB
            const isMatch = await bcrypt.compare(password, user.password);

            //If the passwords don't match return an opaque error
            if (!isMatch) {
                return res.status(400).json({
                    errors: [
                        {
                            msg: 'Invalid Credentials',
                        },
                    ],
                });
            }

            //payload with token as we want to send back an auth token
            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;
