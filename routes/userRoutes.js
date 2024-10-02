const express = require('express');
const { signUp, logIn } = require('../controllers/userControllers');
const router = express.Router();




router.post("/signup", signUp);
router.post("/signin", logIn);




module.exports = router;