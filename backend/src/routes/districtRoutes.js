const express = require("express");
const prisma = require("../lib/prisma");
const apiKeyMiddleware = require("../middleware/apiKeyMiddleware");

const router = express.Router();

router.get("/:stateCode", apiKeyMiddleware, async (req, res) => {
    try {
        const { stateCode } = req.params;

        // Find state
        const state = await prisma.state.findUnique({
            where: {
                code: stateCode
            },
            select: {
                id: true,
                code: true,
                name: true
            }
        });

        if (!state) {
            return res.status(404).json({
                success: false,
                message: "State not found"
            });
        }

        // Check user's state access
        const access = await prisma.userStateAccess.findUnique({
            where: {
                userId_stateId: {
                    userId: req.apiKey.userId,
                    stateId: state.id
                }
            }
        });

        if (!access) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this state"
            });
        }

        // Fetch districts
        const districts = await prisma.district.findMany({
            where: {
                stateId: state.id
            },
            select: {
                code: true,
                name: true
            },
            orderBy: {
                name: "asc"
            }
        });

        res.json({
            success: true,
            stateCode: state.code,
            stateName: state.name,
            count: districts.length,
            data: districts
        });

    } catch (error) {
        console.error("Error fetching districts:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch districts"
        });
    }
});

module.exports = router;