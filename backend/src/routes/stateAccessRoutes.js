const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// ==========================================
// Assign State Access to User
// POST /api/v1/state-access
// ==========================================
router.post("/", async (req, res) => {
    try {
        const { userId, stateId } = req.body;

        if (!userId || !stateId) {
            return res.status(400).json({
                success: false,
                message: "userId and stateId are required",
            });
        }

        // Check user
        const user = await prisma.user.findUnique({
            where: {
                id: Number(userId),
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check state
        const state = await prisma.state.findUnique({
            where: {
                id: Number(stateId),
            },
        });

        if (!state) {
            return res.status(404).json({
                success: false,
                message: "State not found",
            });
        }

        // Check existing access
        const existingAccess = await prisma.userStateAccess.findUnique({
            where: {
                userId_stateId: {
                    userId: Number(userId),
                    stateId: Number(stateId),
                },
            },
        });

        if (existingAccess) {
            return res.status(409).json({
                success: false,
                message: "User already has access to this state",
            });
        }

        // Create access
        const access = await prisma.userStateAccess.create({
            data: {
                userId: Number(userId),
                stateId: Number(stateId),
            },
            include: {
                state: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            message: "State access assigned successfully",
            data: {
                id: access.id,
                userId: access.userId,
                state: access.state,
            },
        });
    } catch (error) {
        console.error("State access error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign state access",
        });
    }
});
// ==========================================
// Get State Access for User
// GET /api/v1/state-access/user/:userId
// ==========================================
router.get("/user/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Valid userId is required",
            });
        }

        const accesses = await prisma.userStateAccess.findMany({
            where: {
                userId,
            },
            include: {
                state: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                state: {
                    name: "asc",
                },
            },
        });

        return res.json({
            success: true,
            count: accesses.length,
            data: accesses.map((access) => ({
                id: access.id,
                state: access.state,
            })),
        });
    } catch (error) {
        console.error("Get state access error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch state access",
        });
    }
});

module.exports = router;