const { v2: cloudinary } = require('cloudinary');
const fs = require('fs').promises;


// Cloudnary Configuration


cloudinary.config({
    cloud_name: "dkp1pshuw",
    api_key: 132241477568727,
    api_secret: "YeM3fKPw_O904tNzG1d0NDPycx4"
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