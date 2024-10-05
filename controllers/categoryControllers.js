const Category = require('../models/categoryModels');

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const category = await Category.create({ name });

        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({
            message: err.message,
            success: false
        });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({
            message: err.message,
            success: false
        });
    }
};



module.exports = { createCategory, getCategories };