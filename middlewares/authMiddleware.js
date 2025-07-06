const jwt = require('jsonwebtoken');
const User = require('../models/userModels');

const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authorization required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user || req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

module.exports = { authMiddleware, adminMiddleware };