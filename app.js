const express = require('express');
const app = express();
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')
const categoryRoutes = require("./routes/categoryRoutes")


//middlewares

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.json({ limit: "16kb" }))



//


app.get("/", (req, res) => {
    res.send("Hello")
})



// routes


//user
app.use("/api/user", userRoutes)

//category
app.use("/api/category", categoryRoutes)





module.exports = app;


