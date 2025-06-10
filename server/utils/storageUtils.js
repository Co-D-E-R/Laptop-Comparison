// Storage utility functions for backend
// Matches the logic used in advanced search for consistent display

const formatStorageSize = (size) => {
    if (!size || isNaN(size) || size <= 0) return "";

    const numericSize = typeof size === 'string' ? parseInt(size) : size;

    // Logic matching advanced search: if value < 10, treat as TB; otherwise as GB
    if (numericSize < 10) {
        // This is a TB value stored as single digit (1 = 1TB, 2 = 2TB)
        return `${numericSize}TB`;
    } else if (numericSize >= 1000) {
        // Large GB values - convert to TB for display
        const tbValue = numericSize / 1000;
        return `${tbValue % 1 === 0 ? tbValue.toFixed(0) : tbValue.toFixed(1)}TB`;
    } else {
        // GB values
        return `${numericSize}GB`;
    }
};

const formatStorage = (storage) => {
    if (!storage) return "Unknown Storage";

    const sizeText = formatStorageSize(storage.size);
    const typeText = storage.type ? ` ${storage.type.toUpperCase()}` : "";

    return `${sizeText}${typeText}`.trim() || "Unknown Storage";
};

module.exports = {
    formatStorageSize,
    formatStorage
};
