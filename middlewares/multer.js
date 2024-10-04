const multer = require('multer');


// multer disk storage

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/tmp/my-uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + file.originalName;
        cb(null, uniqueSuffix)
    }
})

export const upload = multer({ storage });






