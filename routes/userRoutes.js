const express = require('express');
const { signUp,
    logIn,
    getAuthenticatedUser,
    googleLogin,
    discordLogin,
    addPurchasedGameToUser,
    getAllUsers,
    getRecentUsers,
    getSingleUser,
    getUserByName } = require('../controllers/userControllers');
const { isAuthenticated, isAdmin, xAuthMiddleware } = require('../middlewares/auth');
const router = express.Router();




router.post('/signup', signUp);
router.post('/signin', logIn);
router.get('/me', isAuthenticated, getAuthenticatedUser);
router.post('/google', googleLogin);
router.post('/discord', discordLogin);

// Admin: Add a paid game to a user's purchasedGames[]
router.post('/add-purchased-game', isAdmin, addPurchasedGameToUser);

// Admin: Get all users
router.get('/all', isAdmin, getAllUsers);
// Admin: Get recently joined users
router.get('/recent', isAdmin, getRecentUsers);
// Admin: Get a single user by username
router.get('/by-username', isAdmin, getUserByName); // ?username=...
// Admin: Get a single user by email or id
router.get('/by-email', isAdmin, getSingleUser); // can use ?email=...
router.get('/:id', isAdmin, getSingleUser); // can use /:id for id-based lookup



module.exports = router;