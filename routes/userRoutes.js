const express = require('express');
const { signUp, logIn, getAuthenticatedUser, getSingleUser } = require('../controllers/userControllers');
const { isAuthenticated, xAuthMiddleware } = require('../middlewares/auth');
const router = express.Router();




router.post("/signup", xAuthMiddleware, signUp);
router.post("/signin", xAuthMiddleware, logIn);
router.get("/", isAuthenticated, getAuthenticatedUser)
router.get("/active", xAuthMiddleware, getSingleUser)




module.exports = router;