const uploadOnCloudinary = require("../config/cloudnary")
const App = require('../models/appModels')

const createApp = async (req, res) => {
    const { title, description, platform, isPaid, price, downloadLink, size, category, gameplayVideos } = req.body;

    try {



        // Upload each thumbnail to Cloudinary


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
            return res.status(400).json({ error: 'No thumbnails uploaded' });
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
            category,
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
}



module.exports = { createApp };