const express = require('express');
const { signUp,
    logIn,
    getAuthenticatedUser,
    googleLogin,
    discordLogin } = require('../controllers/userControllers');
const { isAuthenticated, xAuthMiddleware } = require('../middlewares/auth');
const router = express.Router();




router.post('/signup', signUp);
router.post('/signin', logIn);
router.get('/me', isAuthenticated, getAuthenticatedUser);
router.post('/google', googleLogin);
router.post('/discord', discordLogin);



module.exports = router;