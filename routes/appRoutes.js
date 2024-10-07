const express = require('express');
const router = express.Router();
const upload = require("../middlewares/multer");
const { createApp } = require('../controllers/appControllers');




router.post("/create", upload.fields([
    { name: 'thumbnail', maxCount: 1 }
])
    , createApp);


module.exports = router;