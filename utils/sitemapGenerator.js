const { SitemapStream } = require('sitemap');
const { Readable } = require('stream');
const App = require('../models/appModels');
const Category = require('../models/categoryModels');
const urlGenerator = require('./urlGenerator');

const generateSitemap = async (baseUrl) => {
    try {
        const sitemapStream = new SitemapStream({ hostname: baseUrl });

        // Add static routes
        const staticRoutes = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/category/mac/games', changefreq: 'daily', priority: 0.9 },
            { url: '/category/pc/games', changefreq: 'daily', priority: 0.9 },
            { url: '/category/android/games', changefreq: 'daily', priority: 0.9 },
            { url: '/category/mac/softwares', changefreq: 'daily', priority: 0.9 },
            { url: '/category/pc/softwares', changefreq: 'daily', priority: 0.9 },
            { url: '/category/ppsspp/iso', changefreq: 'daily', priority: 0.9 },
            { url: '/category/ps2/iso', changefreq: 'daily', priority: 0.9 }
        ];

        staticRoutes.forEach(route => sitemapStream.write(route));

        // Add dynamic app routes
        const apps = await App.find().populate('category');
        apps.forEach(app => {
            // App detail page
            sitemapStream.write({
                url: urlGenerator.appUrl(app),  // Use app._id to generate the URL
                changefreq: 'weekly',
                priority: 0.8,
                lastmod: app.updatedAt
            });
        });

        // Add category routes
        const categories = await Category.find();
        categories.forEach(category => {
            sitemapStream.write({
                url: urlGenerator.categoryUrl(category),
                changefreq: 'daily',
                priority: 0.8
            });
        });

        sitemapStream.end();  // End the stream

        return sitemapStream;  // Return the stream directly
    } catch (error) {
        console.error('Error generating sitemap:', error);
        throw error;
    }
};

module.exports = { generateSitemap };
