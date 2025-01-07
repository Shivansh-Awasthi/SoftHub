const mongoose = require('mongoose');


const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/Softhub`)
        console.log(`MongDb is connected, Host is: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log(`MongoDB error ${error}`);
        process.exit(1);
    }
}

module.exports = connectDb;