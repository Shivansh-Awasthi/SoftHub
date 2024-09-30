const express = require('express');
const app = express();



//middlewares




app.get("/", (req, res) => {
    res.send("Hello")
})




module.exports = app;


