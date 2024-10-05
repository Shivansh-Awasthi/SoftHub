const express = require('express');
const router = express.Router();
const upload = require("../middlewares/multer");
const { createApp } = require('../controllers/appControllers');




router.post("/create", upload.single("thumbnail"), createApp);


module.exports = router;