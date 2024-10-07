const uploadOnCloudinary = require("../config/cloudnary")
const App = require('../models/appModels')
const Category = require('../models/categoryModels');
const cleanUpLocalFiles = require('../utils/fileCleaner');


// ---ADMIN PANEL--- Create apps

const createApp = async (req, res) => {
    const { title, description, platform, isPaid, price, downloadLink, size, category } = req.body;

    try {


        //category handeling

        let categoryObj;

        // If the user provides a category name, check if it already exists
        if (category) {
            categoryObj = await Category.findOne({ name: category });
            if (!categoryObj) {
                // If it doesn't exist, create a new category
                categoryObj = new Category({ name: category });
                await categoryObj.save();
            } else {
                // If it exists, use the existing category
                console.log("Category already exists. Using existing category.");
            }
        } else {
            return res.status(400).json({ message: "Category is required" });
        }



        // Upload each thumbnail to Cloudinary //

        const thumbnailUrls = [];

        // Check if thumbnails were uploaded

        if (req.files['thumbnail']) {

            for (const file of req.files['thumbnail']) {
                const thumbnailResult = await uploadOnCloudinary(file.path); // Upload file to Cloudinary

                if (thumbnailResult) {
                    thumbnailUrls.push(thumbnailResult.secure_url); // Store the secure URL
                } else {
                    return res.status(500).json({ error: 'Failed to upload thumbnail to Cloudinary' });
                }
            }
        } else {
            return res.status(400).json({
                error: 'No thumbnails uploaded'
            });
        }



        // add new app

        const newApp = await App.create({
            title,
            description,
            platform,
            isPaid,
            price,
            downloadLink,
            size,
            thumbnail: thumbnailUrls,  // Use the  secure_url from the response
            category: categoryObj._id
        });


        res.status(201).json({
            newApp,
            success: true
        });

    } catch (error) {
        res.status(500).json({
            message: "Error in adding a new app " + error,
            success: false
        })
    }
    finally {

        // It is used to clean up the uploads folder after the execution

        cleanUpLocalFiles("./uploads");
    }
}


// ---Get all Apps---

const getAllApps = async (req, res) => {
    try {
        const apps = await App.find().populate('category'); // Populate category details
        res.status(200).json({
            apps,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching apps: " + error,
            success: false
        });
    }
};


// ---Get apps by Category

const getAppsByCategory = async (req, res) => {
    const { categoryName } = req.params;

    try {
        // Fetch apps that match the category name and populate category details
        const apps = await App.find({ category: { $in: await Category.find({ name: categoryName }).select('_id') } }).populate('category', 'name');

        if (apps.length === 0) {
            return res.status(404).json({ message: "No apps found for this category", success: false });
        }
        res.status(200).json({ apps, success: true });
    } catch (error) {
        res.status(500).json({ message: "Error fetching apps by category: " + error, success: false });
    }
};






module.exports = { createApp, getAllApps, getAppsByCategory };