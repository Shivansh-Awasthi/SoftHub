const generateSlug = (text) => {
    return text.toLowerCase().replace(/\s+/g, '-');
};

const urlGenerator = {
    // This URL is for both the game detail page and the download link
    appUrl: (app) => `/download/${generateSlug(app.platform)}/${generateSlug(app.title)}/${app._id}`,  // Corrected concatenation

    // Category URL (if needed)
    categoryUrl: (category) => `/category/${generateSlug(category.name)}`
};

module.exports = urlGenerator;
