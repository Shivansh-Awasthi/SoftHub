const express = require('express');
const router = express.Router();
const upload = require("../middlewares/multer");
const { createApp, getAllApps, getAppsByCategory, updateApp, getAppById, deleteApp } = require('../controllers/appControllers');
const isAuthenticated = require('../middlewares/auth');



//--- ADMIN PANEL --- create an app
router.post("/admin/create", isAuthenticated, upload.fields([
    { name: 'thumbnail', maxCount: 20 }
]), createApp);

// get all apps
router.get("/all", getAllApps)

// get all by category name
router.get('/category/:categoryName', getAppsByCategory);

// --- ADMIN PANEL --- update  apps
router.put('/edit/:id', updateApp);

// get single app by id
router.get('/get/:id', getAppById);

// --- ADMIN PANEL --- delete app by id
router.delete('/delete/:id', deleteApp)



module.exports = router;