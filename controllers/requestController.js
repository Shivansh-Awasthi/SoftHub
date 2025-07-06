const GameRequest = require('../models/gameRequestModels');
const Vote = require('../models/voteModels');
const User = require('../models/userModels');
const rateLimit = require('express-rate-limit');
const moment = require('moment');
const axios = require('axios');
const { Types } = require('mongoose');

// Rate limiting middleware (1 request per week per user/IP)
// const requestLimiter = rateLimit({
//     windowMs: 10 * 1000, // 1 week
//     max: 1,
//     keyGenerator: (req) => {
//         return req.user ? req.user.id : req.ip;
//     },
//     handler: (req, res) => {
//         res.status(429).json({
//             error: 'You can only submit 1 game request per week'
//         });
//     }
// });

// Main controller functions

exports.checkNewUser = async function (req, res, next) {
    try {
        const user = await User.findById(req.user._id).select('createdAt');
        if (!user || !user.createdAt) {
            return res.status(403).json({ error: 'Invalid user or missing creation date' });
        }

        const minAgeMs = 1000 * 60 * 60 * 24 * 7; // 7 days
        const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();

        if (accountAgeMs < minAgeMs) {
            const daysLeft = Math.ceil((minAgeMs - accountAgeMs) / (1000 * 60 * 60 * 24));
            return res.status(403).json({
                error: 'Your account must be at least 7 days old to use this feature.',
                newUser: true,
                daysLeft
            });
        }

        next(); // ✅ pass control to controller
    } catch (err) {
        console.error('New user check error:', err);
        res.status(500).json({ error: 'Server error during new user check' });
    }
};




// In requestController.js



exports.createRequest = [
    async (req, res) => {
        try {
            // Block new users(< 7 days) from requesting
            const user = await User.findById(req.user._id).select('createdAt');
            const windowMs1 = 1000 * 60 * 60 * 24 * 7;
            if (user && user.createdAt && (Date.now() - user.createdAt) < windowMs1) {
                const daysLeft = Math.ceil((windowMs1 - (Date.now() - user.createdAt)) / (1000 * 60 * 60 * 24));
                return res.status(403).json({
                    error: 'Your account must be at least 7 days old to request games.',
                    newUser: true,
                    daysLeft
                });
            }

            // ===== SPECIAL HANDLING FOR DUMMY REQUESTS =====
            const isDummyRequest = req.body.title === "dummy" &&
                req.body.platform === "PC" &&
                req.body.steamLink === "https://store.steampowered.com/app/1/Dummy/";

            if (isDummyRequest) {
                // Only check rate limit without creating a real request
                const windowMs = 60 * 1000 * 60 * 24 * 7; // 1 week
                const recentRequest = await GameRequest.findOne({
                    $or: [
                        { requestedBy: req.user?._id },
                        { ipAddress: req.ip }
                    ],
                    status: { $nin: ['rejected', 'deleted'] },
                    createdAt: { $gt: new Date(Date.now() - windowMs) }
                });

                if (recentRequest) {
                    return res.status(429).json({
                        error: 'You can only submit 1 game request per week',
                        nextRequestAvailable: new Date(recentRequest.createdAt.getTime() + windowMs)
                    });
                } else {
                    // Return success without creating a request
                    return res.status(200).json({
                        dummyCheck: true,
                        available: true,
                        message: 'Dummy request check successful - you have requests available'
                    });
                }
            }
            // ===== END DUMMY HANDLING =====

            // Block real requests with "dummy" title
            if (req.body.title.toLowerCase().trim() === "dummy") {
                return res.status(400).json({ error: 'Invalid game title' });
            }

            // Validate Steam URL
            if (req.body.steamLink && !/^https:\/\/store\.steampowered\.com\/app\/\d+\/[a-zA-Z0-9_]+[\/]?$/.test(req.body.steamLink)) {
                return res.status(400).json({ error: 'Invalid Steam URL format' });
            }

            // Escape special regex characters in title
            const escapedTitle = req.body.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Check for duplicate
            const duplicate = await GameRequest.findOne({
                title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
                platform: req.body.platform,
                status: { $nin: ['rejected', 'deleted'] }
            });

            if (duplicate) {
                return res.status(409).json({ error: 'This game has already been requested for this platform' });
            }

            // Check rate limit for real requests
            const windowMs = 60 * 1000 * 60 * 24 * 7; // 1 week in milliseconds
            const recentRequest = await GameRequest.findOne({
                $or: [
                    { requestedBy: req.user?._id },
                    { ipAddress: req.ip }
                ],
                status: { $nin: ['rejected', 'deleted'] },
                createdAt: { $gt: new Date(Date.now() - windowMs) }
            });

            if (recentRequest) {
                const nextRequestAvailable = new Date(recentRequest.createdAt.getTime() + windowMs);
                return res.status(429).json({
                    error: 'You can only submit 1 game request per week',
                    nextRequestAvailable
                });
            }

            // Create the request
            const newRequest = await GameRequest.create({
                title: req.body.title,
                platform: req.body.platform,
                steamLink: req.body.steamLink,
                requestedBy: req.user._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                status: 'pending',
                approvalDeadline: moment().add(7, 'days').toDate(),
                processingDeadline: moment().add(15, 'days').toDate()
            });

            res.status(201).json(newRequest);
        } catch (err) {
            // Handle Mongoose validation errors
            if (err.name === 'ValidationError') {
                const errors = Object.values(err.errors).map(el => el.message);
                return res.status(400).json({ errors });
            }

            // Handle duplicate key error
            if (err.code === 11000) {
                return res.status(409).json({ error: 'This game request already exists' });
            }

            console.error('Create request error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
];



exports.voteRequest = async (req, res) => {
    try {

        // Block new users(< 7 days) from requesting
        const user = await User.findById(req.user._id).select('createdAt');
        const windowMs1 = 1000 * 60 * 60 * 24 * 7;
        if (user && user.createdAt && (Date.now() - user.createdAt) < windowMs1) {
            const daysLeft = Math.ceil((windowMs1 - (Date.now() - user.createdAt)) / (1000 * 60 * 60 * 24));
            return res.status(403).json({
                error: 'Your account must be at least 7 days old to request games.',
                newUser: true,
                daysLeft
            });
        }


        const request = await GameRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        // 1. Block repeated voting on THIS SPECIFIC REQUEST forever
        const alreadyVotedThisRequest = request.voters.some(
            voter => voter.user && voter.user.equals(req.user._id)
        );

        if (alreadyVotedThisRequest) {
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
        const todaysVote = await Vote.findOne({
            user: req.user._id,
            createdAt: { $gte: startOfTodayUTC, $lt: endOfTodayUTC }
        });

        if (todaysVote) {
            return res.status(400).json({
                error: 'You can only vote once per day',
                // Helpful info for frontend
                nextVoteAvailable: endOfTodayUTC.toISOString()
            });
        }

        // 5. IP-based restrictions remain the same
        const ipVoteCount = await Vote.countDocuments({
            ipAddress: req.ip,
            createdAt: { $gte: startOfTodayUTC, $lt: endOfTodayUTC }
        });

        if (ipVoteCount >= 1) {
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
            .populate('voters.user', '_id') // Populate voter user IDs for frontend vote status
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

        const oldRejectedRequests = await GameRequest.find({
            status: 'rejected',
            rejectedAt: { $lt: weekAgo }
        }, '_id');

        const oldRejectedIds = oldRejectedRequests.map(req => req._id);

        await Vote.deleteMany({ request: { $in: oldRejectedIds } });

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
        ;
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