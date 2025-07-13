const sharedLinks = {};

module.exports = {
    sharedLinks,
    generateShareId: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
};