const uploadOnCloudinary = require("../config/cloudnary")
const App = require('../models/appModels')

const createApp = async (req, res) => {
    const { title, description, platform, isPaid, price, downloadLink, size, category, gameplayVideos } = req.body;

    try {

        // upload on cloudinary
        const thumbnailResult = await uploadOnCloudinary(req.files['thumbnail'][0].path);

        if (!thumbnailResult) {
            return res.status(500).json({ error: 'Failed to upload thumbnail' });
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
            thumbnail: thumbnailResult.secure_url,  // Use the  secure_url from the response
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