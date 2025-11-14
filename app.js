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
app.set('trust proxy', true);

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://toxicgame.net',
        'http://toxicgame.net'
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
app.use('/api/requests', xAuthMiddleware, gameRequestRoutes);

// game randomizer
app.use('/api/random', xAuthMiddleware, gameRandomizerRoutes);

// comments
app.use('/api/comments', xAuthMiddleware, commentRoutes);



module.exports = app;


