const App = require('../models/appModels');
const Category = require('../models/categoryModels');

// Get a random Mac game
const randomMacGame = async (req, res) => {
    try {
        // Find the 'Mac Games' category
        const macCategory = await Category.findOne({ name: /mac/i });
        if (!macCategory) {
            return res.status(404).json({ message: 'Mac Games category not found', success: false });
        }
        // Find all games in 'Mac Games' category, EXCLUDE paid games
        const macGames = await App.find({ category: macCategory._id, isPaid: { $ne: true } });
        if (!macGames.length) {
            return res.status(404).json({ message: 'No Mac games found', success: false });
        }
        // Pick a random game
        const randomIndex = Math.floor(Math.random() * macGames.length);
        res.status(200).json({ game: macGames[randomIndex], success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching random Mac game: ' + error.message, success: false });
    }
};

// Get a random PC game
const randomPcGame = async (req, res) => {
    try {
        // Find the 'PC Games' category
        const pcCategory = await Category.findOne({ name: /pc/i });
        if (!pcCategory) {
            return res.status(404).json({ message: 'PC Games category not found', success: false });
        }
        // Find all games in 'PC Games' category, EXCLUDE paid games
        const pcGames = await App.find({ category: pcCategory._id, isPaid: { $ne: true } });
        if (!pcGames.length) {
            return res.status(404).json({ message: 'No PC games found', success: false });
        }
        // Pick a random game
        const randomIndex = Math.floor(Math.random() * pcGames.length);
        res.status(200).json({ game: pcGames[randomIndex], success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching random PC game: ' + error.message, success: false });
    }
};

module.exports = {
    randomMacGame,
    randomPcGame
};
