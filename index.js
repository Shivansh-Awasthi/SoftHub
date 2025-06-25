const express = require('express');
const app = require('./app'); // This is your Express app
const dotenv = require('dotenv');
const connectDb = require('./db/db');
const cron = require('node-cron');
const moment = require('moment');
const requestController = require('./controllers/requestController');
const Game = require('./models/appModels'); // Renamed import to Game

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
                await requestController.processRequestLifecycles();
                console.log('Request lifecycle processing completed successfully');
            } catch (error) {
                console.error('Error during daily lifecycle processing:', error);
            }
        });

        // ===========================================
        // POPULARITY METRICS RESET JOBS
        // ===========================================

        // Daily reset at midnight
        cron.schedule('0 0 * * *', async () => {
            try {
                console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Resetting daily views...`);
                await Game.updateMany({}, { 'popularity.dailyViews': 0 });
                console.log('Daily views reset completed');
            } catch (error) {
                console.error('Error resetting daily views:', error);
            }
        });

        // Weekly reset on Monday at 00:00
        cron.schedule('0 0 * * 1', async () => {
            try {
                console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Resetting weekly views...`);
                await Game.updateMany({}, { 'popularity.weeklyViews': 0 });
                console.log('Weekly views reset completed');
            } catch (error) {
                console.error('Error resetting weekly views:', error);
            }
        });

        // Monthly reset on 1st of month at 00:00
        cron.schedule('0 0 1 * *', async () => {
            try {
                console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Resetting monthly views...`);
                await Game.updateMany({}, { 'popularity.monthlyViews': 0 });
                console.log('Monthly views reset completed');
            } catch (error) {
                console.error('Error resetting monthly views:', error);
            }
        });

        // Start server AFTER DB connection
        app.listen(port, () => {
            console.log(`Server is running on port: ${port}`);
            console.log(`Scheduled tasks:`);
            console.log(`- Request lifecycle processing at 3:00 AM`);
            console.log(`- Daily views reset at 00:00`);
            console.log(`- Weekly views reset on Monday at 00:00`);
            console.log(`- Monthly views reset on 1st of month at 00:00`);
        });
    })
    .catch((err) => {
        console.log(`MongoDB connection error ${err}`);
        process.exit(1);
    });