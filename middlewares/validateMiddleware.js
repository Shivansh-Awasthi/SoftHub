const { body } = require('express-validator');

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