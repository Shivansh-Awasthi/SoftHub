const { v2: cloudinary } = require('cloudinary');
const fs = require('fs').promises;
const dotenv = require('dotenv');
dotenv.config();


// Cloudnary Configuration


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});




// upload config

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        // upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })


        // file uploaded successfully

        console.log(`File uploaded on cloudinary, url: ${response.url}`);


        // Clean up the locally saved file

        await fs.unlink(localFilePath);
        return response;


    } catch (error) {

        console.error('Error uploading to Cloudinary:', error);
        await fs.unlink(localFilePath)  // removes the locally saved temp. file as upload operation got failed.

        return null;
    }
}


module.exports = uploadOnCloudinary;