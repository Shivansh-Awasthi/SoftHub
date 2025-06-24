const express = require('express');
const app = require('./app');
const dotenv = require('dotenv');
const connectDb = require('./db/db');
const cron = require('node-cron');
const moment = require('moment');  // Add moment import
const requestController = require('./controllers/requestController');
dotenv.config();
const port = process.env.PORT;

// MongoDB connection
connectDb()
    .then(() => {
        console.log('MongoDB is connected');

        // ===========================================
        // DAILY CRON JOB FOR REQUEST LIFECYCLE PROCESSING
        // ===========================================

        cron.schedule('0 3 * * *', async () => {
            try {
                console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Running daily request lifecycle processing...`);

                // Updated to use requestController instead of gameRequestController
                await requestController.processRequestLifecycles();

                console.log('Request lifecycle processing completed successfully');
            } catch (error) {
                console.error('Error during daily lifecycle processing:', error);
            }
        });

        // Start server AFTER DB connection
        app.listen(port, () => {
            console.log(`Server is running on port: ${port}`);
            console.log(`Scheduled tasks: Daily lifecycle processing at 3:00 AM server time`);
        });
    })
    .catch((err) => {
        console.log(`MongoDB connection error ${err}`);
        process.exit(1);  // Exit process on DB connection failure
    });