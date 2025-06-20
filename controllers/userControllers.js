const User = require("../models/userModels");
const bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken');



const signUp = async (req, res) => {
    const { username, email, password } = req.body;

    // Validation: Check if all required fields are present
    if (!username || !email || !password) {
        return res.status(400).json({
            message: "All fields are required: username, email, and password.",
            success: false,
        });
    }

    try {
        // Check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({
                message: "User already exists, go to the login page.",
                success: false,
            });
        }

        // Create a new user
        bcrypt.genSalt(12, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
                const newUser = await User.create({
                    username,
                    email,
                    password: hash,
                    purchasedGames: []
                });

                const token = jwt.sign({ email }, process.env.JWT_TOKEN);
                res.cookie("token", token, { httpOnly: true, secure: true });

                return res.status(201).json({
                    message: "User Created",
                    success: true,
                    newUser
                });
            });
        });
    } catch (error) {
        return res.status(500).json({
            message: "Signup error: " + error.message,
            success: false
        });
    }
}


//   Signin



const logIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User Not Found, go to Signup Page",
                success: false
            });
        }

        bcrypt.compare(password, user.password, async function (err, result) {
            if (!result) {
                return res.status(401).json({
                    message: "Wrong Password ",
                    success: false
                });
            }

            const token = jwt.sign({ email, role: user.role, userId: user._id, purchasedGames: user.purchasedGames }, process.env.JWT_TOKEN);
            res.cookie("token", token, { httpOnly: true, secure: true });

            return res.status(200).json({
                message: "User logged In",
                success: true,
                token,
                user: {
                    username: user.username,
                    email: user.email,
                    userId: user._id,
                    purchasedGames: user.purchasedGames, // Include purchased games here
                    role: user.role
                }
            });
        });

    } catch (error) {
        return res.status(500).json({
            message: "Login error " + error.message,
            success: false
        });
    }
};



const getAuthenticatedUser = async (req, res) => {
    try {
        // Decode token from the Authorization header
        const token = req.headers.authorization.split(' ')[1]; // 'Bearer token'
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);

        // Find the user by the ID in the token
        const user = await User.findById(decoded.userId); // Assuming token contains userId

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Send user data excluding password
        return res.status(200).json({
            user: {
                username: user.username,
                email: user.email,
                purchasedGames: user.purchasedGames,
                role: user.role,
            },
            success: true
        });

    } catch (error) {
        return res.status(401).json({
            message: 'Unauthorized, Invalid token',
            success: false
        });
    }
};



// In your user controller file (e.g., userController.js)

const getSingleUser = async (req, res) => {
    try {
        // Get the token from the Authorization header
        const token = req.headers.authorization?.split(' ')[1]; // 'Bearer token'

        if (!token) {
            return res.status(401).json({
                message: 'No token provided',
                success: false
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);

        // Find the user by ID
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Return user data (excluding sensitive information)
        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                purchasedGames: user.purchasedGames
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Invalid token',
                success: false
            });
        }

        return res.status(500).json({
            message: 'Server error: ' + error.message,
            success: false
        });
    }
};





module.exports = { signUp, logIn, getAuthenticatedUser, getSingleUser };