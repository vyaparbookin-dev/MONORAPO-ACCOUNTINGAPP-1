import express from "express";
import { getUsers, updateUserRole } from "../controllers/userController.js";
import { protect } from "../middleware/authmiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Sirf 'admin' in APIs ko access kar sakta hai
router.get("/", protect, authorizeRoles("admin"), getUsers);
router.put("/:id/role", protect, authorizeRoles("admin"), updateUserRole);

export default router;