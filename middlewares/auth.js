const jwt = require('jsonwebtoken');
const User = require('../models/userModels');
const isAuthenticated = async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        let token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        // No token case
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized, JWT token is required, please login first ",
                success: false
            });
        }

        // Try to verify the token
        try {
            const decoded = jwt.verify(token, process.env.JWT_TOKEN);
            req.user = decoded;  // Attach the decoded token data to the request
        } catch (error) {
            // If token is malformed or expired, return 401 Unauthorized
            return res.status(401).json({
                message: "Invalid or malformed token",
                success: false
            });
        }

        // Check if the user exists based on the decoded token (optional, only if needed)
        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            return res.status(401).json({
                message: "User not found, please login again",
                success: false
            });
        }

        // You can attach other user-related data if needed
        req.user.purchasedGames = user.purchasedGames;

        // Proceed to the next middleware or route handler
        next();

    } catch (error) {
        console.log(error); // Log error for debugging
        return res.status(401).json({
            message: "Unauthorized, JWT token is required",
            success: false
        });
    }
};



// middlewares/auth.js
const isAdmin = async (req, res, next) => {
    try {
        // First verify general authentication
        await isAuthenticated(req, res, () => { });

        // Then check for admin role
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "Forbidden: Admin privileges required",
                success: false
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Authorization failed",
            success: false
        });
    }
};


module.exports = { isAuthenticated, isAdmin };
