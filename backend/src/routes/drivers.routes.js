import { Router } from "express";
import driverController from "../controllers/drivers.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { idParamValidator } from "../validators/common.js";
import {
    driverCreateValidators,
    driverUpdateValidators,
} from "../validators/index.js";

const router = Router();

router.use(protect);

// Specific routes must be registered before /:id
router.get("/eligible", driverController.getEligibleDrivers);
router.get("/available", driverController.getAvailableDrivers);
router.get("/suspended", driverController.getSuspendedDrivers);
router.get("/license-expiring", driverController.getExpiringLicenses);
router.get("/:id/license", idParamValidator, validateRequest, driverController.getLicenseDetails);
router.patch("/:id/status", idParamValidator, validateRequest, driverController.updateStatus);

router.route("/")
    .get(driverController.list)
    .post(driverCreateValidators, validateRequest, driverController.create);

router.route("/:id")
    .get(idParamValidator, validateRequest, driverController.getOne)
    .patch(idParamValidator, driverUpdateValidators, validateRequest, driverController.update)
    .delete(idParamValidator, validateRequest, driverController.remove);

export default router;
