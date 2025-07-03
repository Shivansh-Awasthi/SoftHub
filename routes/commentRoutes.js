const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentControllers');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const { isMod, checkBlocked } = require('../middlewares/validateMiddleware');

// Public: Get all comments for an app (with replies, sorted)
router.get('/:appId', commentController.getCommentsForApp);

// Auth: Add a comment
router.post('/:appId', isAuthenticated, checkBlocked, commentController.addComment);

// Auth: Reply to a comment
router.post('/reply/:commentId', isAuthenticated, checkBlocked, commentController.replyToComment);

// Auth: Edit own comment
router.put('/edit/:commentId', isAuthenticated, commentController.editOwnComment);

// Auth: Delete own comment
router.delete('/:commentId', isAuthenticated, commentController.deleteOwnComment);

// Admin/Mod: Delete any comment (cascade)
router.delete('/admin/:commentId', isAuthenticated, isMod, commentController.adminDeleteComment);

// Admin/Mod: Pin/unpin a comment
router.post('/pin/:commentId', isAuthenticated, isMod, commentController.pinComment);

// Admin/Mod: Block a user from commenting
router.post('/block/:userId', isAuthenticated, isMod, commentController.blockUser);

// Get all comments by a user
router.get('/user/:userId', commentController.getCommentsByUser);

// Get notifications (replies to user's comments)
router.get('/notifications', isAuthenticated, commentController.getUserNotifications);

module.exports = router;
