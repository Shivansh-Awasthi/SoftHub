const express = require('express');
const router = express.Router();
const gameRequestController = require('../controllers/requestController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRequestLimiter = rateLimit({
    windowMs: 7 * 24 * 60 * 60 * 1000, // 1 week
    max: 1,
    keyGenerator: (req) => req.user ? req.user.id : req.ip,
    message: 'You can only submit 1 game request per week',
    standardHeaders: true,
    legacyHeaders: false
});

const voteLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1,
    keyGenerator: (req) => req.user ? req.user.id : req.ip,
    message: 'You can only vote once per day',
    standardHeaders: true,
    legacyHeaders: false
});

// ===========================================
// PUBLIC ROUTES
// ===========================================
router.get('/', gameRequestController.getPublicRequests); // Get all public requests
router.get('/:id', gameRequestController.getRequestById); // Get single request by ID

// ===========================================
// AUTHENTICATED USER ROUTES
// ===========================================
router.post(
    '/',
    authMiddleware, // Requires login
    createRequestLimiter, // 1 request/week limit
    validateRequest, // Input validation
    gameRequestController.createRequest // Create new game request
);

router.post(
    '/:id/vote',
    authMiddleware, // Requires login
    voteLimiter, // 1 vote/day limit
    gameRequestController.voteRequest // Vote for a request
);

// ===========================================
// ADMIN ROUTES
// ===========================================
router.get(
    '/admin/requests',
    authMiddleware,
    adminMiddleware, // Requires admin role
    gameRequestController.getAllRequests // Get all requests (admin view)
);

router.patch(
    '/admin/requests/:id/status',
    authMiddleware,
    adminMiddleware,
    gameRequestController.updateRequestStatus // Update request status
);

router.post(
    '/admin/requests/:id/process',
    authMiddleware,
    adminMiddleware,
    gameRequestController.processGame // Process game implementation
);

router.patch(
    '/admin/requests/bulk-status',
    authMiddleware,
    adminMiddleware,
    gameRequestController.bulkStatusUpdate // Bulk status update
);

router.get(
    '/admin/requests/:id/stats',
    authMiddleware,
    adminMiddleware,
    gameRequestController.getVotingStats // Get voting statistics
);

module.exports = router;