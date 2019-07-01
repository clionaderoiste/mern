//v1 of the coures used passport, useful for facebook or twitter login
const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
    //get the token from the header
    const token = req.header('x-auth-token');

    //return a not authorised status if there is no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorisation denied' });
    }

    //verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        //happy call the callback
        next();
    } catch (err) {
        //there is a token but it is not valid
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
