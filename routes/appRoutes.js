const express = require('express');
const router = express.Router();
const upload = require("../middlewares/multer");
const {
    createApp,
    getAllApps,
    getAppsByCategory,
    updateApp,
    getAppById,
    deleteApp,
    getPaidAppAccess,
    recordDownload  // Added the new controller
} = require('../controllers/appControllers');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const { modOrAdminMiddleware } = require('../middlewares/authMiddleware');

// --- ADMIN PANEL --- Create an app
router.post("/admin/create",
    isAuthenticated,
    isAdmin,
    upload.fields([
        { name: 'coverImg', maxCount: 1 },
        { name: 'thumbnail', maxCount: 20 }
    ]),
    createApp
);

// Get all apps
router.get("/all", getAllApps)

// Get apps by category name
router.get('/category/:categoryName', getAppsByCategory);

// Get single app by id
router.get('/get/:id', getAppById);

// Record a download (new endpoint)
router.post('/record-download/:id', recordDownload);

// new Protected routes
router.get('/get/:id/protected', isAuthenticated, getPaidAppAccess);

// --- ADMIN PANEL --- Update app
router.put('/edit/:id',
    isAuthenticated,
    modOrAdminMiddleware,
    upload.fields([
        { name: 'coverImg', maxCount: 1 },
        { name: 'thumbnail', maxCount: 20 }
    ]),
    updateApp
);

// --- ADMIN PANEL --- Delete app by id
router.delete('/delete/:id',
    isAuthenticated,
    isAdmin,
    deleteApp
);

module.exports = router;