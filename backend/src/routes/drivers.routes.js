import { Router } from "express";
import driverController from "../controllers/drivers.controller.js";
import { createResourceRouter } from "./resource-router.js";
import {
    driverCreateValidators,
    driverUpdateValidators,
} from "../validators/index.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

// ---------- Driver Specific Routes ----------

router.patch("/me/status", driverController.updateMyStatus);

router.patch("/:id/status", authorizeRoles("DISPATCHER"), driverController.updateStatus);

router.get("/available", driverController.getAvailableDrivers);

router.get("/eligible", driverController.getEligibleDrivers);

router.get(
    "/license-expiring",
    driverController.getExpiringLicenses
);

router.get(
    "/suspended",
    driverController.getSuspendedDrivers
);

router.get(
    "/:id/license",
    driverController.getLicenseDetails
);

// ---------- Generic CRUD ----------

router.use(
    createResourceRouter({
        controller: driverController,
        createValidators: driverCreateValidators,
        updateValidators: driverUpdateValidators,
    })
);

export default router;