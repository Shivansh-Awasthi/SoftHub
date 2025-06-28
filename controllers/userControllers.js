const User = require("../models/userModels");
const App = require("../models/appModels");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Generate default avatar URL
const generateDefaultAvatar = (username) => {
    const firstLetter = username.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${firstLetter}&background=random`;
};

const signUp = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "All fields are required",
            success: false,
        });
    }

    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({
                message: "User already exists",
                success: false,
            });
        }

        bcrypt.genSalt(12, async (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                const newUser = await User.create({
                    username,
                    email,
                    password: hash,
                    avatar: generateDefaultAvatar(username)
                });

                const token = jwt.sign({
                    email,
                    role: newUser.role,
                    userId: newUser._id,
                    purchasedGames: newUser.purchasedGames,
                    avatar: newUser.avatar
                }, process.env.JWT_TOKEN);



                return res.status(201).json({
                    message: "User Created",
                    success: true,
                    user: {
                        token,
                        username,
                        email,
                        avatar: newUser.avatar,
                    }
                });
            });
        });
    } catch (error) {
        return res.status(500).json({
            message: "Signup error: " + error.message,
            success: false
        });
    }
};

const logIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User Not Found",
                success: false
            });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (!result) {
                return res.status(401).json({
                    message: "Wrong Password",
                    success: false
                });
            }

            const token = jwt.sign({ email, role: user.role, userId: user._id, purchasedGames: user.purchasedGames, avatar: user.avatar }, process.env.JWT_TOKEN);


            return res.status(200).json({
                message: "User logged In",
                success: true,
                token,
                user: {
                    username: user.username,
                    email,
                    avatar: user.avatar,
                }
            });
        });
    } catch (error) {
        return res.status(500).json({
            message: "Login error: " + error.message,
            success: false
        });
    }
};

// Google OAuth Login
const googleLogin = async (req, res) => {
    const { accessToken } = req.body;

    try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { sub, email, name, picture } = response.data;
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                username: name,
                email,
                avatar: picture,
                authProvider: 'google',
                providerId: sub
            });
        }

        const token = jwt.sign({
            userId: user._id,
            email,
            role: user.role,
            purchasedGames: user.purchasedGames
        }, process.env.JWT_TOKEN);



        res.status(200).json({
            success: true,
            token,
            user: {
                username: user.username,
                email,
                avatar: user.avatar,
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Google login failed: " + error.message,
            success: false
        });
    }
};

// Discord OAuth Login
const discordLogin = async (req, res) => {
    const { accessToken } = req.body;

    try {
        const response = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { id, username, email, avatar } = response.data;
        const avatarUrl = avatar
            ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
            : generateDefaultAvatar(username);

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                username,
                email,
                avatar: avatarUrl,
                authProvider: 'discord',
                purchasedGames: [],
                providerId: id
            });
        }

        const token = jwt.sign({
            userId: user._id,
            email,
            role: user.role,
            purchasedGames: user.purchasedGames, // ✅ add this
            avatar: user.avatar

        }, process.env.JWT_TOKEN);


        res.status(200).json({
            success: true,
            token,
            user: {
                username: user.username,
                email,
                avatar: user.avatar,
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Discord login failed: " + error.message,
            success: false
        });
    }
};

const getAuthenticatedUser = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'No token provided',
                success: false
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                purchasedGames: user.purchasedGames
            },
            success: true
        });
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid token',
            success: false
        });
    }
};

// Admin: Add a paid game to a user's purchasedGames[]
const addPurchasedGameToUser = async (req, res) => {
    try {
        const { userId, gameId } = req.body;
        if (!userId || !gameId) {
            return res.status(400).json({ success: false, message: "userId and gameId are required" });
        }
        // Find the game and check if it's paid
        const game = await App.findById(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: "Game not found" });
        }
        if (!game.isPaid) {
            return res.status(400).json({ success: false, message: "Game is not a paid game" });
        }
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Add gameId to purchasedGames if not already present
        if (!user.purchasedGames.includes(gameId)) {
            user.purchasedGames.push(gameId);
            await user.save();
        }
        return res.status(200).json({ success: true, message: "Game added to user's purchased games" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single user by ID or email
const getSingleUser = async (req, res) => {
    try {
        // Support both /:id and /by-email?email=...
        const id = req.params.id || req.query.id;
        const email = req.query.email;
        let user;
        if (id) {
            user = await User.findById(id);
        } else if (email) {
            user = await User.findOne({ email });
        } else {
            return res.status(400).json({ success: false, message: "Provide user id or email" });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get 10 most recent users
const getRecentUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).limit(10);
        return res.status(200).json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get a user by username (case-insensitive)
const getUserByName = async (req, res) => {
    try {
        const username = req.query.username || req.params.username;
        if (!username) {
            return res.status(400).json({ success: false, message: "Provide username" });
        }
        const user = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    signUp,
    logIn,
    getAuthenticatedUser,
    googleLogin,
    discordLogin,
    addPurchasedGameToUser,
    getSingleUser,
    getAllUsers,
    getRecentUsers,
    getUserByName
};