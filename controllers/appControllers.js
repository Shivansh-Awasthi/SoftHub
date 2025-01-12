const uploadOnCloudinary = require("../config/cloudnary")
const App = require('../models/appModels')
const Category = require('../models/categoryModels');
const cleanUpLocalFiles = require('../utils/fileCleaner');


// ---ADMIN PANEL--- Create apps

const createApp = async (req, res) => {
    const { title, description, platform, isPaid, price, downloadLink, coverImg, size, category } = req.body;

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
            coverImg,
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
    const { page = 1, limit = 48, q = "" } = req.query; // Default search query is empty

    try {
        let searchQuery = {};

        if (q) {
            // If there's a query string, use a regex to find substrings in the title
            // Using `i` for case-insensitive matching
            searchQuery = { title: { $regex: q, $options: 'i' } };
        }

        const apps = await App.find(searchQuery)
            .populate('category') // Populate category details
            .skip((page - 1) * limit) // Pagination skip
            .limit(Number(limit)); // Pagination limit

        const totalApps = await App.countDocuments(searchQuery);

        res.status(200).json({
            apps,
            total: totalApps,
            success: true
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching apps: " + error.message,
            success: false
        });
    }
};



// ---Get apps by Category

const getAppsByCategory = async (req, res) => {
    const { categoryName } = req.params;
    const { page = 1, limit = 48 } = req.query; // Default limit to 48

    try {
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            return res.status(404).json({
                message: "Category not found",
                success: false
            });
        }

        // Find apps by category, sort by createdAt (newest first), and implement pagination
        const apps = await App.find({ category: category._id }) // Find apps by category
            .populate('category', 'name')
            .sort({ createdAt: -1 }) // Sorting by first new
            .skip((page - 1) * limit)
            .limit(Number(limit)); // Limit the number of results

        // Count total apps for pagination
        const totalApps = await App.countDocuments({ category: category._id });

        if (apps.length === 0) {
            return res.status(404).json({
                message: "No apps found for this category",
                success: false
            });
        }
        res.status(200).json({
            apps,
            total: totalApps, // Send total number of apps for pagination
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching apps by category: " + error,
            success: false
        });
    }
};


// ---ADMIN PANEL--- Update apps

const updateApp = async (req, res) => {
    const { id } = req.params;
    const { title, description, platform, isPaid, price, downloadLink, size, category } = req.body;

    try {
        // Prepare the update object
        const updateData = {};

        // Only include fields that are provided in the request
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (platform) updateData.platform = platform;
        if (isPaid !== undefined) updateData.isPaid = isPaid; // Handle boolean separately
        if (price) updateData.price = price;
        if (downloadLink) updateData.downloadLink = downloadLink;
        if (size) updateData.size = size;

        // Handle category
        if (category) {
            const categoryObj = await Category.findOneAndUpdate(
                { name: category },
                { $setOnInsert: { name: category } },
                { upsert: true, new: true, runValidators: true }
            );
            updateData.category = categoryObj._id;
        }

        // Update the app using findByIdAndUpdate
        const updatedApp = await App.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        // Check if the app was found and updated
        if (!updatedApp) {
            return res.status(404).json({
                message: "App not found",
                success: false
            });
        }

        // Send the updated app in the response
        res.status(200).json({
            updatedApp,
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating app: " + error.message,
            success: false
        });
    }
};


// get by id

const getAppById = async (req, res) => {
    const { id } = req.params; // Get the ID from the URL parameters

    try {
        const app = await App.findById(id).populate('category', 'name'); // Populate category details
        if (!app) {
            return res.status(404).json({
                message: "App not found",
                success: false
            });
        }
        res.status(200).json({
            app,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching app: " + error,
            success: false
        });
    }
};


// ---ADMIN PANEL--- Delete App by id

const deleteApp = async (req, res) => {
    const { id } = req.params;

    try {
        // Find and delete the app by its ID
        const deletedApp = await App.findByIdAndDelete(id);

        // Check if the app was found and deleted
        if (!deletedApp) {
            return res.status(404).json({
                message: "App not found",
                success: false
            });
        }

        res.status(200).json({
            message: "App deleted successfully",
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error deleting app: " + error.message,
            success: false
        });
    }
};





module.exports = { createApp, getAllApps, getAppsByCategory, updateApp, getAppById, deleteApp };