const jwt = require('jsonwebtoken');

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization;

        //no token
        if (!token || token == "") {
            return res.status(401).json({
                message: "Unauthorized, JWT token is required, please login first",
                success: false
            })
        };

        const data = jwt.verify(token, process.env.JWT_TOKEN);
        req.user = data;

        // Check if the user has the ADMIN role
        if (data.role !== 'ADMIN') {
            return res.status(403).json({
                message: "Admin access required",
                success: false
            });
        }

        next();

    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message: "Unauthorized, JWT token is required",
            success: false
        })
    }
};



module.exports = isAuthenticated;