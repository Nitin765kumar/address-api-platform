const express = require("express");
const prisma = require("../lib/prisma");
const apiKeyMiddleware = require("../middleware/apiKeyMiddleware");

const router = express.Router();

router.get("/:districtCode", apiKeyMiddleware, async (req, res) => {
    try {
        const { districtCode } = req.params;

        // Find district with its state
        const district = await prisma.district.findUnique({
            where: {
                code: districtCode
            },
            select: {
                id: true,
                code: true,
                name: true,
                stateId: true
            }
        });

        if (!district) {
            return res.status(404).json({
                success: false,
                message: "District not found"
            });
        }

        // Check user's access to the district's state
        const access = await prisma.userStateAccess.findUnique({
            where: {
                userId_stateId: {
                    userId: req.apiKey.userId,
                    stateId: district.stateId
                }
            }
        });

        if (!access) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this state"
            });
        }

        // Fetch sub-districts
        const subDistricts = await prisma.subDistrict.findMany({
            where: {
                districtId: district.id
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
            districtCode: district.code,
            districtName: district.name,
            count: subDistricts.length,
            data: subDistricts
        });

    } catch (error) {
        console.error("Error fetching sub-districts:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sub-districts"
        });
    }
});

module.exports = router;