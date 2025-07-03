const express = require('express');
const app = express();
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')
const categoryRoutes = require("./routes/categoryRoutes")
const appRoutes = require('./routes/appRoutes')
const sitemapRoutes = require('./routes/sitemapRoutes')
const cookieParser = require('cookie-parser');
const gameRequestRoutes = require('./routes/gameRequestRoutes');
const gameRandomizerRoutes = require('./routes/gameRandomizerRoutes');
const { xAuthMiddleware } = require('./middlewares/auth');
const { authMiddleware } = require('./middlewares/authMiddleware');
const commentRoutes = require('./routes/commentRoutes');



//middlewares

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://toxicgames.in',
        'http://toxicgames.in'
    ],
    credentials: true,
}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.json({ limit: "16kb" }))
app.use(cookieParser());


//


app.get("/", (req, res) => {
    res.send("Hello")
})




// routes


//user
app.use("/api/user", xAuthMiddleware, userRoutes)

//category
app.use("/api/category", xAuthMiddleware, categoryRoutes)

// apps
app.use("/api/apps", xAuthMiddleware, appRoutes)

//sitemap
app.use('/', sitemapRoutes);

// game request
app.use('/api/requests', gameRequestRoutes);

// game randomizer
app.use('/api/random', gameRandomizerRoutes);

// comments
app.use('/api/comments', commentRoutes);



module.exports = app;


