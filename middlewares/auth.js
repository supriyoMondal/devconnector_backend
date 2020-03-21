const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: "No Token,Authorization Denied" });
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
            if (error) {
                return res.status(401).json({ msg: "Token is not verified" });
            } else {
                req.user = decoded.user;
                next();
            }
        })
    } catch (err) {
        console.log("Something Wrong in auth middleware");
        return res.status(500).json({ msg: "Server Error" })
    }
}