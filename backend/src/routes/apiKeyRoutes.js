const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================
// Generate API Key
// POST /api/v1/api-keys
// =====================================
router.post("/", authMiddleware, async (req, res) => {
    try {
        const apiKey = `addr_${crypto.randomBytes(16).toString("hex")}`;
        const apiSecret = crypto.randomBytes(32).toString("hex");

        const secretHash = await bcrypt.hash(apiSecret, 10);

        const createdApiKey = await prisma.apiKey.create({
            data: {
                key: apiKey,
                secretHash,
                userId: req.user.userId,
            },
            select: {
                id: true,
                key: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            success: true,
            message: "API key generated successfully",
            data: {
                id: createdApiKey.id,
                apiKey: createdApiKey.key,
                apiSecret: apiSecret,
                createdAt: createdApiKey.createdAt,
            },
        });
    } catch (error) {
        console.error("API key generation error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate API key",
        });
    }
});

module.exports = router;