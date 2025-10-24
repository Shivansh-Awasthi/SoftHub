const { body } = require('express-validator');
const CommentBlockedUser = require('../models/commentBlockedUser');
const rateLimit = require('express-rate-limit');

exports.validateRequest = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be 3-100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),

    body('platform')
        .isIn(['PC', 'Mac', 'Android', 'iOS', 'Playstation', 'Xbox', 'Switch'])
        .withMessage('Invalid platform'),

    body('steamLink')
        .optional()
        .isURL()
        .withMessage('Invalid URL format')
        .custom(value => {
            if (!value) return true;
            return /^https:\/\/store\.steampowered\.com\/app\/\d+\/[a-zA-Z0-9_]+[\/]?$/.test(value);
        })
        .withMessage('Must be a valid Steam store URL')
];

// Middleware to check if user is a moderator or admin
const isMod = (req, res, next) => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'moderator' || req.user.role === 'mod' || req.user.role === 'admin' || req.user.role === 'MOD')) {
        return next();
    }
    return res.status(403).json({ message: 'Moderator or admin access required.' });
};

// Middleware to check if user is blocked from commenting
const checkBlocked = async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    const blocked = await CommentBlockedUser.findOne({ userId: req.user._id });
    if (blocked) {
        return res.status(403).json({ message: 'You are blocked from commenting.' });
    }
    next();
};

// Rate limiter for comment endpoints (e.g., 5 comments per minute per user)
const commentRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each user to 5 requests per windowMs
    message: { message: 'Too many comments, please slow down.' },
    keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip
});

// Simple spam protection middleware (basic repeated content check)
const recentComments = new Map(); // userId -> { lastContent, lastTime }
const spamProtection = (req, res, next) => {
    if (!req.user) return next();
    const userId = req.user._id.toString();
    const now = Date.now();
    const content = (req.body.comment || req.body.content || '').trim();
    if (!content) return next();
    const recent = recentComments.get(userId);
    if (recent && recent.lastContent === content && now - recent.lastTime < 30000) {
        return res.status(429).json({ message: 'Duplicate/spam comment detected. Please wait before posting the same content.' });
    }
    recentComments.set(userId, { lastContent: content, lastTime: now });
    next();
};

// Export checkBlocked for direct import
module.exports = {
    validateRequest: exports.validateRequest,
    commentRateLimiter,
    spamProtection,
    isMod,
    checkBlocked
};