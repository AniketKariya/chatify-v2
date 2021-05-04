const generateMessage = (from, to, text) => {
    return {
        from,
        to,
        text,
        createdAt: new Date().getTime()
    };
};

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    };
};

module.exports = {
    generateMessage,
    generateLocationMessage
};
