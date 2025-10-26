const Comment = require('../models/commentModels');
const CommentBlockedUser = require('../models/commentBlockedUser');
const App = require('../models/appModels');
const User = require('../models/userModels');

// Utility: Check if user is admin or mod
function isAdminOrMod(user) {
    return user.role === 'ADMIN' || user.role === 'MOD';
}

// Utility: Cascade delete replies
async function cascadeDelete(commentId) {
    const replies = await Comment.find({ parentId: commentId });
    for (const reply of replies) {
        await cascadeDelete(reply._id);
        await reply.deleteOne();
    }
}

// 1. Get all comments for an app (with replies, sorted)
exports.getCommentsForApp = async (req, res) => {
    try {
        const { appId } = req.params;
        const { sort = 'newest', filter } = req.query;
        let sortObj = { createdAt: -1 };
        if (sort === 'oldest') sortObj = { createdAt: 1 };
        if (sort === 'pinned') sortObj = { isPinned: -1, createdAt: -1 };
        let query = { appId, parentId: null, isDeleted: false };
        // Optionally filter by user if filter=own and user is authenticated
        if (filter === 'own' && req.user) {
            query.userId = req.user.userId;
        }
        const comments = await Comment.find(query)
            .sort({ isPinned: -1, ...sortObj })
            .populate('userId', 'username avatar role');
        // Fetch replies for each comment
        const withReplies = await Promise.all(comments.map(async c => {
            const replies = await Comment.find({ parentId: c._id, isDeleted: false })
                .sort({ createdAt: 1 })
                .populate('userId', 'username avatar role');
            return { ...c.toObject(), replies };
        }));
        res.json({ comments: withReplies, total: withReplies.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Add a comment
exports.addComment = async (req, res) => {
    try {
        const { appId } = req.params;
        const { content } = req.body;
        if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
        const comment = await Comment.create({
            appId,
            userId: req.user.userId,
            content,
            parentId: null
        });
        res.status(201).json({ comment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Reply to a comment
exports.replyToComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
        const parent = await Comment.findById(commentId);
        if (!parent || parent.isDeleted) return res.status(404).json({ error: 'Parent comment not found' });
        const reply = await Comment.create({
            appId: parent.appId,
            userId: req.user.userId,
            content,
            parentId: commentId
        });
        parent.repliesCount += 1;
        await parent.save();
        res.status(201).json({ reply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Edit own comment
exports.editOwnComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) return res.status(404).json({ error: 'Comment not found' });

        // FIX: Compare ObjectIds properly
        if (!comment.userId.equals(req.user.userId)) return res.status(403).json({ error: 'Not your comment' });

        comment.content = content;
        await comment.save();
        res.json({ comment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Delete own comment
exports.deleteOwnComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) return res.status(404).json({ error: 'Comment not found' });

        // FIX: Compare ObjectIds properly
        if (!comment.userId.equals(req.user.userId)) return res.status(403).json({ error: 'Not your comment' });

        comment.isDeleted = true;
        await comment.save();
        // Cascade delete replies
        await cascadeDelete(commentId);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. Admin/Mod: Delete any comment (cascade)
exports.adminDeleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        comment.isDeleted = true;
        await comment.save();
        await cascadeDelete(commentId);
        res.json({ message: 'Comment deleted by admin/mod' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. Pin/unpin a comment
exports.pinComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) return res.status(404).json({ error: 'Comment not found' });
        comment.isPinned = !comment.isPinned;
        await comment.save();
        res.json({ comment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. Block a user from commenting
exports.blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason = '' } = req.body;
        const alreadyBlocked = await CommentBlockedUser.findOne({ userId });
        if (alreadyBlocked) return res.status(400).json({ error: 'User already blocked' });
        await CommentBlockedUser.create({ userId, blockedBy: req.user.userId, reason });
        res.json({ message: 'User blocked from commenting' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 9. Get all comments by a user
exports.getCommentsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const comments = await Comment.find({ userId, isDeleted: false })
            .sort({ createdAt: -1 })
            .populate('appId', 'title');
        res.json({ comments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 10. Get notifications (replies to user's comments) - RETURN ALL
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find all comments by user
        const userComments = await Comment.find({
            userId,
            isDeleted: false,
            parentId: null
        });

        const userCommentIds = userComments.map(c => c._id);

        // Find ALL replies to user's comments (both read and unread)
        const replies = await Comment.find({
            parentId: { $in: userCommentIds },
            isDeleted: false,
            userId: { $ne: userId }
        })
            .populate('userId', 'username avatar role')
            .populate('appId', 'title slug')
            .sort({ createdAt: -1 });

        res.json({ notifications: replies });
    } catch (err) {
        console.error("Error in getUserNotifications:", err);
        res.status(500).json({ error: err.message });
    }
};

// 11. Mark a single notification as read - FIXED
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        // Find the notification (reply)
        const notification = await Comment.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Verify this notification belongs to the user (is a reply to their comment)
        const userComment = await Comment.findOne({
            _id: notification.parentId,
            userId: userId
        });

        if (!userComment) {
            return res.status(403).json({ error: 'Not authorized to mark this notification as read' });
        }

        // Check if already read
        const alreadyRead = notification.readBy.some(read =>
            read.userId && read.userId.toString() === userId.toString()
        );

        if (!alreadyRead) {
            notification.readBy.push({ userId: userId });
            notification.isRead = true;
            await notification.save();
        }

        res.json({
            message: 'Notification marked as read',
            notificationId: notificationId
        });
    } catch (err) {
        console.error("Error in markNotificationAsRead:", err);
        res.status(500).json({ error: err.message });
    }
};

// 12. Mark all notifications as read - FIXED
exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find all comments by user
        const userComments = await Comment.find({
            userId,
            isDeleted: false,
            parentId: null
        });

        const userCommentIds = userComments.map(c => c._id);

        // Find all unread replies to user's comments
        const unreadReplies = await Comment.find({
            parentId: { $in: userCommentIds },
            isDeleted: false,
            userId: { $ne: userId }
        });

        // Mark all as read
        const updatePromises = unreadReplies.map(async (reply) => {
            const alreadyRead = reply.readBy.some(read =>
                read.userId && read.userId.toString() === userId.toString()
            );

            if (!alreadyRead) {
                reply.readBy.push({ userId: userId });
                reply.isRead = true;
                return reply.save();
            }
        });

        await Promise.all(updatePromises);

        res.json({
            message: 'All notifications marked as read',
            markedCount: unreadReplies.length
        });
    } catch (err) {
        console.error("Error in markAllNotificationsAsRead:", err);
        res.status(500).json({ error: err.message });
    }
};

// 13. Get notification count - FIXED
exports.getNotificationCount = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find all comments by user
        const userComments = await Comment.find({
            userId,
            isDeleted: false,
            parentId: null
        });

        const userCommentIds = userComments.map(c => c._id);

        // Find all unread replies
        const unreadReplies = await Comment.find({
            parentId: { $in: userCommentIds },
            isDeleted: false,
            userId: { $ne: userId }
        });

        // Count only unread ones
        const unreadCount = unreadReplies.filter(reply => {
            if (!reply.readBy || reply.readBy.length === 0) return true;

            const hasRead = reply.readBy.some(read =>
                read.userId && read.userId.toString() === userId.toString()
            );

            return !hasRead;
        }).length;

        res.json({ unreadCount });
    } catch (err) {
        console.error("Error in getNotificationCount:", err);
        res.status(500).json({ error: err.message });
    }
};

// 13. Enhanced version with read status tracking (OPTIONAL)
// If you want to add proper read status tracking, you can modify your Comment model:
/*
const commentSchema = new mongoose.Schema({
    // ... existing fields ...
    isRead: { type: Boolean, default: false }, // For notification status
    readBy: [{ // Track who has read the notification
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }]
});
*/

// Then update the mark as read functions to actually update the database
exports.markNotificationAsReadEnhanced = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        const notification = await Comment.findByIdAndUpdate(
            notificationId,
            {
                $addToSet: { readBy: { userId: userId, readAt: new Date() } },
                isRead: true
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({
            message: 'Notification marked as read',
            notification
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// 14. Admin/Mod: Get all comments with pagination and filters
exports.getAllCommentsForAdmin = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sortBy = 'newest',
            status = 'all', // all, read, unread
            appId = null,
            userId = null,
            search = null
        } = req.query;

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        let query = { isDeleted: false };

        // Filter by admin read status
        if (status === 'unread') {
            query.adminRead = false;
        } else if (status === 'read') {
            query.adminRead = true;
        }

        // Filter by app
        if (appId) {
            query.appId = appId;
        }

        // Filter by user
        if (userId) {
            query.userId = userId;
        }

        // Search in content
        if (search) {
            query.content = { $regex: search, $options: 'i' };
        }

        // Build sort
        let sortObj = {};
        switch (sortBy) {
            case 'oldest':
                sortObj = { createdAt: 1 };
                break;
            case 'mostReplies':
                sortObj = { repliesCount: -1, createdAt: -1 };
                break;
            case 'pinned':
                sortObj = { isPinned: -1, createdAt: -1 };
                break;
            default: // newest
                sortObj = { createdAt: -1 };
        }

        // Get comments with pagination
        const comments = await Comment.find(query)
            .populate('userId', 'username avatar role email')
            .populate('appId', 'title slug')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination
        const totalComments = await Comment.countDocuments(query);

        // Get counts for different statuses
        const totalUnread = await Comment.countDocuments({
            ...query,
            adminRead: false,
            isDeleted: false
        });
        const totalRead = await Comment.countDocuments({
            ...query,
            adminRead: true,
            isDeleted: false
        });

        res.json({
            comments,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalComments / limitNum),
                totalComments,
                totalUnread,
                totalRead,
                hasNext: pageNum < Math.ceil(totalComments / limitNum),
                hasPrev: pageNum > 1
            },
            filters: {
                status,
                sortBy,
                appId,
                userId,
                search
            }
        });
    } catch (err) {
        console.error("Error in getAllCommentsForAdmin:", err);
        res.status(500).json({ error: err.message });
    }
};

// 15. Admin/Mod: Mark a comment as read
exports.markCommentAsReadByAdmin = async (req, res) => {
    try {
        const { commentId } = req.params;

        // Check if comment exists
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Mark as read by admin
        comment.adminRead = true;
        await comment.save();

        res.json({
            message: 'Comment marked as read by admin',
            comment: comment
        });
    } catch (err) {
        console.error("Error in markCommentAsReadByAdmin:", err);
        res.status(500).json({ error: err.message });
    }
};

// 16. Admin/Mod: Mark multiple comments as read
exports.markMultipleCommentsAsReadByAdmin = async (req, res) => {
    try {
        const { commentIds } = req.body;

        if (!commentIds || !Array.isArray(commentIds)) {
            return res.status(400).json({ error: 'commentIds array is required' });
        }

        // Update all comments to mark as read
        const result = await Comment.updateMany(
            { _id: { $in: commentIds } },
            { $set: { adminRead: true } }
        );

        res.json({
            message: `${result.modifiedCount} comments marked as read by admin`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error("Error in markMultipleCommentsAsReadByAdmin:", err);
        res.status(500).json({ error: err.message });
    }
};

// 17. Admin/Mod: Mark all comments as read
exports.markAllCommentsAsReadByAdmin = async (req, res) => {
    try {
        // Mark all unread comments as read
        const result = await Comment.updateMany(
            { adminRead: false, isDeleted: false },
            { $set: { adminRead: true } }
        );

        res.json({
            message: `All ${result.modifiedCount} comments marked as read by admin`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error("Error in markAllCommentsAsReadByAdmin:", err);
        res.status(500).json({ error: err.message });
    }
};

// 18. Admin/Mod: Get comment statistics
exports.getCommentStatistics = async (req, res) => {
    try {
        // Get various counts for dashboard
        const totalComments = await Comment.countDocuments({ isDeleted: false });
        const totalUnread = await Comment.countDocuments({
            adminRead: false,
            isDeleted: false
        });
        const totalRead = await Comment.countDocuments({
            adminRead: true,
            isDeleted: false
        });
        const pinnedComments = await Comment.countDocuments({
            isPinned: true,
            isDeleted: false
        });
        const todayComments = await Comment.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            isDeleted: false
        });
        const weekComments = await Comment.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            isDeleted: false
        });

        // Get recent comments for activity
        const recentComments = await Comment.find({ isDeleted: false })
            .populate('userId', 'username avatar')
            .populate('appId', 'title')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            statistics: {
                totalComments,
                totalUnread,
                totalRead,
                pinnedComments,
                todayComments,
                weekComments
            },
            recentActivity: recentComments
        });
    } catch (err) {
        console.error("Error in getCommentStatistics:", err);
        res.status(500).json({ error: err.message });
    }
};
