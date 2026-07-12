import Driver from "../models/driver.model.js";
import { buildCrudController } from "./crud.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const crud = buildCrudController(Driver);

// PATCH /drivers/:id/status
const updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const allowed = [
        "AVAILABLE",
        "ON_TRIP",
        "OFF_DUTY",
        "SUSPENDED",
    ];

    if (!allowed.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid driver status",
        });
    }

    const driver = await Driver.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    );

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: "Driver not found",
        });
    }

    res.json({
        success: true,
        data: driver,
    });
});

// GET /drivers/available
const getAvailableDrivers = asyncHandler(async (_req, res) => {
    const today = new Date();

    const drivers = await Driver.find({
        status: "AVAILABLE",
        licenseExpiry: { $gte: today },
    });

    res.json({
        success: true,
        data: drivers,
    });
});

// GET /drivers/eligible
// Used while creating trips
const getEligibleDrivers = asyncHandler(async (_req, res) => {
    const today = new Date();

    const drivers = await Driver.find({
        status: "AVAILABLE",
        licenseExpiry: { $gte: today },
    }).select(
        "name licenseNumber licenseCategory safetyScore status"
    );

    res.json({
        success: true,
        data: drivers,
    });
});

// GET /drivers/license-expiring?days=30
const getExpiringLicenses = asyncHandler(async (req, res) => {
    const days = Number(req.query.days) || 30;

    const today = new Date();

    const future = new Date();
    future.setDate(today.getDate() + days);

    const drivers = await Driver.find({
        licenseExpiry: {
            $gte: today,
            $lte: future,
        },
    });

    res.json({
        success: true,
        data: drivers,
    });
});

// GET /drivers/suspended
const getSuspendedDrivers = asyncHandler(async (_req, res) => {
    const drivers = await Driver.find({
        status: "SUSPENDED",
    });

    res.json({
        success: true,
        data: drivers,
    });
});

// GET /drivers/:id/license
const getLicenseDetails = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id).select(
        "name licenseNumber licenseCategory licenseExpiry"
    );

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: "Driver not found",
        });
    }

    res.json({
        success: true,
        data: driver,
    });
});

export default {
    ...crud,

    updateStatus,

    getAvailableDrivers,

    getEligibleDrivers,

    getExpiringLicenses,

    getSuspendedDrivers,

    getLicenseDetails,
};