const rateLimit = require("express-rate-limit");

const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,             // Maximum 30 requests per minute
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

module.exports = apiRateLimiter;