const prisma = require("../lib/prisma");

const apiKeyMiddleware = async (req, res, next) => {
    const startTime = Date.now();

    try {
        const apiKey = req.header("X-API-Key");

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: "API key is required",
            });
        }

        const keyRecord = await prisma.apiKey.findUnique({
            where: {
                key: apiKey,
            },
        });

        if (!keyRecord) {
            return res.status(401).json({
                success: false,
                message: "Invalid API key",
            });
        }

        // Store authenticated API key
        req.apiKey = keyRecord;

        // Continue request
        res.on("finish", async () => {
            try {
                const responseTime = Date.now() - startTime;

                await prisma.apiLog.create({
                    data: {
                        endpoint: req.originalUrl,
                        responseTime: responseTime,
                        userId: keyRecord.userId,
                        apiKeyId: keyRecord.id,
                    },
                });
            } catch (error) {
                console.error("API log error:", error);
            }
        });

        next();

    } catch (error) {
        console.error("API key authentication error:", error);

        return res.status(500).json({
            success: false,
            message: "API key authentication failed",
        });
    }
};

module.exports = apiKeyMiddleware;