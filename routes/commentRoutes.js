const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentControllers');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const { isMod, checkBlocked } = require('../middlewares/validateMiddleware');

// ✅ CORRECT ORDER: Notification routes FIRST
router.get('/notifications/count', isAuthenticated, commentController.getNotificationCount);
router.get('/notifications', isAuthenticated, commentController.getUserNotifications);
router.post('/notifications/read-all', isAuthenticated, commentController.markAllNotificationsAsRead);
router.post('/notifications/:notificationId/read', isAuthenticated, commentController.markNotificationAsRead);

// 🔥 NEW ADMIN ROUTES
router.get('/admin/all', isAuthenticated, isMod, commentController.getAllCommentsForAdmin);
router.get('/admin/statistics', isAuthenticated, isMod, commentController.getCommentStatistics);
router.post('/admin/:commentId/read', isAuthenticated, isMod, commentController.markCommentAsReadByAdmin);
router.post('/admin/mark-multiple-read', isAuthenticated, isMod, commentController.markMultipleCommentsAsReadByAdmin);
router.post('/admin/mark-all-read', isAuthenticated, isMod, commentController.markAllCommentsAsReadByAdmin);

// THEN parameterized routes
router.get('/:appId', commentController.getCommentsForApp);
router.post('/:appId', isAuthenticated, checkBlocked, commentController.addComment);
router.post('/reply/:commentId', isAuthenticated, checkBlocked, commentController.replyToComment);
router.put('/edit/:commentId', isAuthenticated, commentController.editOwnComment);
router.delete('/:commentId', isAuthenticated, commentController.deleteOwnComment);
router.delete('/admin/:commentId', isAuthenticated, isMod, commentController.adminDeleteComment);
router.post('/pin/:commentId', isAuthenticated, isMod, commentController.pinComment);
router.post('/block/:userId', isAuthenticated, isMod, commentController.blockUser);
router.get('/user/:userId', commentController.getCommentsByUser);

module.exports = router;