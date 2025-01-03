const generateSlug = (text) => {
    return text.toLowerCase().replace(/\s+/g, '-');
};

const urlGenerator = {
    // This URL is for both the game detail page and the download link
    appUrl: (app) => `/${app._id}`,  // Using app._id for both game details and download

    // Category URL (if needed)
    categoryUrl: (category) => `/category/${generateSlug(category.name)}`
};

module.exports = urlGenerator;
