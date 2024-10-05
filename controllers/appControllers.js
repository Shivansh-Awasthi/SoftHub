const uploadOnCloudinary = require("../config/cloudnary")




const createApp = async (req, res) => {
    const { title, description, platform, isPaid, price, downloadLink, size, category } = req.body;

    try {

        // upload on cloudinary
        const thumbnailResult = await uploadOnCloudinary(req.file.path);

        if (!thumbnailResult) {
            return res.status(500).json({ error: 'Failed to upload thumbnail' });
        }

        // add new app

        const newApp = new App({
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
        await newApp.save();

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