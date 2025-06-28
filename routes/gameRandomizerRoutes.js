const express = require('express');
const { randomMacGame, randomPcGame } = require('../controllers/gameRandomizer');

const router = express.Router();

// Route for random Mac game
router.get('/mac', randomMacGame);

// Route for random PC game
router.get('/pc', randomPcGame);

module.exports = router;
