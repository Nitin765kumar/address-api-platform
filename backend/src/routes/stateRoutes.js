const apiKeyMiddleware = require("../middleware/apiKeyMiddleware");
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", apiKeyMiddleware, async (req, res) => {
    try {
        const states = await prisma.state.findMany({
            select: {
                code: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json({
            success: true,
            count: states.length,
            data: states,
        });
    } catch (error) {
        console.error("Error fetching states:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch states",
        });
    }
});

module.exports = router;