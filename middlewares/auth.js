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

        const data = jwt.verify(token, "string");
        // console.log(data);
        req.user = data;

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