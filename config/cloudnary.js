const { v2: cloudinary } = require('cloudinary');
const fs = require('fs').promises;
const dotenv = require('dotenv');
dotenv.config();

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// upload config
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.error('No file path provided.'); // in case of no file
            return null;
        }
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            transformation: [
                { quality: 'auto' }, // Enable automatic quality selection
                { fetch_format: 'auto' } // Enable automatic format selection
            ]
        });

        // file uploaded successfully
        console.log(`File uploaded on Cloudinary, URL: ${response.secure_url}`); //response.secure_url

        // Clean up the locally saved file
        await fs.unlink(localFilePath);
        return response;

    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);

        // Attempt to delete the local file even on failure
        try {
            await fs.unlink(localFilePath); // Clean up even on failure
            console.log(`Successfully deleted local file: ${localFilePath}`);
        } catch (unlinkError) {
            console.error(`Failed to delete local file: ${localFilePath}`, unlinkError);
        }

        return null;
    }
}

module.exports = uploadOnCloudinary;
