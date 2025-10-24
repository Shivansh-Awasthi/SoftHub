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

// 10. Get notifications (replies to user's comments)
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Find all comments by user
        const userComments = await Comment.find({ userId, isDeleted: false });
        const userCommentIds = userComments.map(c => c._id);
        // Find replies to those comments
        const replies = await Comment.find({ parentId: { $in: userCommentIds }, isDeleted: false })
            .populate('userId', 'username avatar')
            .populate('appId', 'title');
        res.json({ notifications: replies });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
