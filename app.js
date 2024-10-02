const express = require('express');
const app = express();
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')


//middlewares

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.json({ limit: "16kb" }))



//


app.get("/", (req, res) => {
    res.send("Hello")
})



// routes

app.use("/api", userRoutes)





module.exports = app;


