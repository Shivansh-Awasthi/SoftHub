const { generateSitemap } = require('../utils/sitemapGenerator');

const getSitemap = async (req, res) => {
    try {
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = process.env.BASE_URL || 'https://toxicgame.net';

        const sitemapStream = await generateSitemap(baseUrl);

        // Set the correct header for XML content
        res.header('Content-Type', 'application/xml');

        // Pipe the sitemap stream directly to the response
        sitemapStream.pipe(res);
    } catch (error) {
        console.error('Error serving sitemap:', error);
        res.status(500).json({
            message: "Error generating sitemap",
            success: false
        });
    }
};

module.exports = { getSitemap };
