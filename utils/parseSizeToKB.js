// utils/parseSizeToKB.js
function parseSizeToKB(sizeStr) {
    if (!sizeStr || typeof sizeStr !== 'string') return null;
    const sizeMatch = sizeStr.trim().toUpperCase().match(/^([\d.]+)\s*(KB|MB|GB|TB)$/);
    if (!sizeMatch) return null;
    const value = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2];
    if (unit === 'KB') return Math.round(value);
    if (unit === 'MB') return Math.round(value * 1024);
    if (unit === 'GB') return Math.round(value * 1024 * 1024);
    if (unit === 'TB') return Math.round(value * 1024 * 1024 * 1024);
    return null;
}

module.exports = parseSizeToKB;
