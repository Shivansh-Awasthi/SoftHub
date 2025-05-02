const express = require('express');
const { signUp, logIn, getAuthenticatedUser, getSingleUser } = require('../controllers/userControllers');
const { isAuthenticated } = require('../middlewares/auth');
const router = express.Router();




router.post("/signup", signUp);
router.post("/signin", logIn);
router.get("/", isAuthenticated, getAuthenticatedUser)
router.get("/users/active", getSingleUser)




module.exports = router;