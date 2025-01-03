const express = require('express');
const router = express.Router();
const { getSitemap } = require('../controllers/sitemapControllers');

router.get('/sitemap.xml', getSitemap);

module.exports = router;