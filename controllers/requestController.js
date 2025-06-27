const GameRequest = require('../models/gameRequestModels');
const Vote = require('../models/voteModels');
const User = require('../models/userModels');
const rateLimit = require('express-rate-limit');
const moment = require('moment');
const axios = require('axios');
const { Types } = require('mongoose');

// Rate limiting middleware (1 request per week per user/IP)
const requestLimiter = rateLimit({
    windowMs: 7 * 24 * 60 * 60 * 1000, // 1 week
    max: 1,
    keyGenerator: (req) => {
        return req.user ? req.user.id : req.ip;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'You can only submit 1 game request per week'
        });
    }
});

// Main controller functions
exports.createRequest = [
    requestLimiter,
    async (req, res) => {
        try {
            // Validate Steam URL if provided
            if (req.body.steamLink &&
                !/^https:\/\/store\.steampowered\.com\/app\/\d+\/[a-zA-Z0-9_]+[\/]?$/.test(req.body.steamLink)) {
                return res.status(400).json({ error: 'Invalid Steam URL format' });
            }

            const newRequest = await GameRequest.create({
                title: req.body.title,
                description: req.body.description,
                platform: req.body.platform,
                steamLink: req.body.steamLink,
                requestedBy: req.user._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                status: 'pending',
                // Set expiration dates based on your rules
                approvalDeadline: moment().add(7, 'days').toDate(),
                processingDeadline: moment().add(15, 'days').toDate()
            });

            res.status(201).json(newRequest);
        } catch (err) {
            if (err.name === 'DuplicateGameError') {
                return res.status(409).json({ error: err.message });
            }
            res.status(500).json({ error: 'Server error' });
        }
    }
];

exports.voteRequest = async (req, res) => {
    try {
        const request = await GameRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        // 1. Block repeated voting on same request — forever
        if (await Vote.findOne({ request: req.params.id, user: req.user._id })) {
            return res.status(400).json({ error: 'You already voted on this request' });
        }

        // 2. Check if request is still votable
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'This request is closed for voting' });
        }

        // 3. Calculate UTC start/end of current day
        const now = new Date();
        const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const endOfTodayUTC = new Date(startOfTodayUTC);
        endOfTodayUTC.setUTCDate(endOfTodayUTC.getUTCDate() + 1);

        // 4. Enforce one vote per user per day (across all requests)
        if (await Vote.exists({ user: req.user._id, createdAt: { $gte: startOfTodayUTC, $lt: endOfTodayUTC } })) {
            return res.status(400).json({ error: 'You can only vote once per day' });
        }

        // 5. Enforce IP-based restrictions (prevent multi-account abuse)
        const ipVoteCount = await Vote.countDocuments({
            ipAddress: req.ip,
            createdAt: { $gte: startOfTodayUTC, $lt: endOfTodayUTC }
        });

        if (ipVoteCount >= 1) { // 1 vote per IP per day
            return res.status(400).json({ error: 'Your network has reached its vote limit' });
        }

        // Record vote
        const newVote = await Vote.create({
            request: request._id,
            user: req.user._id,
            ipAddress: req.ip,
            createdAt: new Date()
        });

        // Update request
        request.votes += 1;
        request.voters.push({ user: req.user._id, ipAddress: req.ip, votedAt: new Date() });
        request.lastVotedAt = new Date();

        // Promote to processing at 20 votes
        if (request.votes >= 20) {
            request.status = 'processing';
            request.processingDeadline = moment().add(15, 'days').toDate();
        }

        await request.save();

        res.json({
            message: 'Vote recorded',
            votes: request.votes,
            status: request.status,
            dailyVotesLeft: 0 // User has no votes left for the day
        });
    } catch (err) {
        console.error('Vote error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getPublicRequests = async (req, res) => {
    try {
        // Get requests that are still active
        const requests = await GameRequest.find({
            status: { $in: ['pending', 'approved', 'processing', 'rejected'] }
        })
            .sort({ votes: -1, createdAt: -1 })
            .populate('requester', 'username')
            .limit(50);

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getRequestById = async (req, res) => {
    try {
        const request = await GameRequest.findById(req.params.id)
            .populate('requester', 'username')
            .populate('voters.user', 'username');

        if (!request || request.status === 'deleted') {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ADMIN CONTROLLERS
exports.getAllRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = status ? { status } : { status: { $ne: 'deleted' } };

        const requests = await GameRequest.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('requester', 'username email');

        const count = await GameRequest.countDocuments(query);

        res.json({
            requests,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// In updateRequestStatus controller
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected', 'processing', 'deleted'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = { status };

        if (status === 'approved') {
            updateData.approvedAt = new Date();
        } else if (status === 'rejected') {
            updateData.rejectedAt = new Date();
            updateData.expirationDate = moment().add(7, 'days').toDate();
        }

        const updated = await GameRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Delete votes when request is deleted
        if (status === 'deleted') {
            await Vote.deleteMany({ request: req.params.id });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.processGame = async (req, res) => {
    try {
        const request = await GameRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        // Process game implementation would go here
        // This is where you'd actually add the game to your platform

        // After processing, update status
        request.status = 'implemented';
        request.implementedAt = new Date();
        await request.save();

        // Notify voters (pseudo-code)
        const voterIds = request.voters.map(v => v.user);
        await User.updateMany(
            { _id: { $in: voterIds } },
            {
                $push: {
                    notifications: {
                        message: `Game you voted for "${request.title}" is now available!`,
                        link: `/games/${request._id}`
                    }
                }
            }
        );

        res.json({
            message: 'Game processed and added to collection',
            game: request
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// CRON JOB: Process request lifecycles daily

exports.processRequestLifecycles = async () => {
    try {
        const now = new Date();
        const weekAgo = moment().subtract(7, 'days').toDate();
        const fifteenDaysAgo = moment().subtract(15, 'days').toDate();

        // 1. Reject pending requests older than 7 days
        await GameRequest.updateMany(
            {
                status: 'pending',
                createdAt: { $lt: weekAgo }
            },
            {
                status: 'rejected',
                rejectedAt: now,
                expirationDate: moment().add(7, 'days').toDate()
            }
        );

        // 2. Delete rejected requests after 7 days
        await GameRequest.deleteMany({
            status: 'rejected',
            rejectedAt: { $lt: weekAgo }
        });

        // 3. Delete approved requests after 15 days
        await GameRequest.deleteMany({
            status: 'approved',
            approvedAt: { $lt: fifteenDaysAgo }
        });

        // 4. Delete expired processing requests
        await GameRequest.deleteMany({
            status: 'processing',
            processingDeadline: { $lt: now }
        });

        console.log('Request lifecycles processed successfully');
        return { success: true, processed: true };
    } catch (err) {
        console.error('Error processing request lifecycles:', err);
        return { success: false, error: err.message };
    }
};
// Additional helper for admins
exports.bulkStatusUpdate = async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'Invalid request format' });
        }

        const updateData = { status };

        if (status === 'approved') {
            updateData.approvedAt = new Date();
            updateData.processingDeadline = moment().add(15, 'days').toDate();
        } else if (status === 'rejected') {
            updateData.rejectedAt = new Date();
            updateData.expirationDate = moment().add(7, 'days').toDate();
        }

        const result = await GameRequest.updateMany(
            { _id: { $in: ids } },
            updateData
        );

        // Clean up votes if deleted
        if (status === 'deleted') {
            await Vote.deleteMany({ request: { $in: ids } });
        }

        res.json({
            message: `Updated ${result.nModified} requests`,
            status
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Get voting statistics
exports.getVotingStats = async (req, res) => {
    try {
        const requestId = req.params.id;

        if (!Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ error: 'Invalid request ID format' });
        }

        const objectId = new Types.ObjectId(requestId);

        // 1. Votes by day aggregation
        const votesByDay = await Vote.aggregate([
            { $match: { request: objectId } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Voter demographics aggregation
        const voterPlatforms = await Vote.aggregate([
            { $match: { request: objectId } },
            {
                $lookup: {
                    from: 'users', // Ensure this matches your collection name
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { $unwind: "$userData" },
            {
                $group: {
                    _id: "$userData.platform",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({ votesByDay, voterPlatforms });
    } catch (err) {
        console.error("Voting Stats Error:", err);
        res.status(500).json({ error: 'Server error' });
    }
};