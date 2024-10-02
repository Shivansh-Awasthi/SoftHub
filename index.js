const express = require('express');
const app = require('./app');
const dotenv = require('dotenv');
const connectDb = require('./db/db');
dotenv.config();
const port = process.env.PORT;


//  MongoDB connection


connectDb()
    .then(() => {
        console.log('MongoDB is connected');
    })
    .catch((err) => {
        console.log(`MongoDB error ${err}`);
        throw err;
    })


//  server listen


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);

})