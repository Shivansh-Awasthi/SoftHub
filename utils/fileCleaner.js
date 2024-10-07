const fs = require('fs');
const path = require('path');

// A helper function to clean up local files...


const cleanUpLocalFiles = (folderPath) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Failed to read directory: ${folderPath}`, err);
            return;
        }
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Failed to delete file: ${filePath}`, err);
                } else {
                    console.log(`Successfully deleted file: ${filePath}`);
                }
            });
        }
    });
};

module.exports = cleanUpLocalFiles;