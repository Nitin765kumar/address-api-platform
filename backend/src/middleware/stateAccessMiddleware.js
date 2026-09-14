const prisma = require("../lib/prisma");

const stateAccessMiddleware = async (req, res, next) => {
    try {
        // API key authentication ke baad req.apiKey available hoga
        if (!req.apiKey) {
            return res.status(401).json({
                success: false,
                message: "API key authentication required",
            });
        }

        const stateId = Number(req.params.stateId);

        if (!stateId) {
            return res.status(400).json({
                success: false,
                message: "Valid stateId is required",
            });
        }

        const userId = req.apiKey.userId;

        const access = await prisma.userStateAccess.findUnique({
            where: {
                userId_stateId: {
                    userId: userId,
                    stateId: stateId,
                },
            },
        });

        if (!access) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this state",
            });
        }

        next();
    } catch (error) {
        console.error("State access authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify state access",
        });
    }
};

module.exports = stateAccessMiddleware;