const express = require('express');
const router = express.Router();
const upload = require("../middlewares/multer");
const { createApp, getAllApps } = require('../controllers/appControllers');



//--- ADMIN PANEL --- create an app
router.post("/admin/create", upload.fields([
    { name: 'thumbnail', maxCount: 20 }
]), createApp);

// get all apps
router.get("/all", getAllApps)


module.exports = router;