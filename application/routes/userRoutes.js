import express from "express";

import {
  registerUser,
  getUser,
  updateUserRole,
  deactivateUser,
  userExists,
} from "../controllers/userController.js";

const router = express.Router();

// Registr new user
router.post("/register", registerUser);

// Check if user exists
router.get("/exists/:id", userExists);

// Get user by ID
router.get("/:id", getUser);

// Update user role
router.put("/:id/role", updateUserRole);

// Deactivate user (soft delete)
router.delete("/:id", deactivateUser);

export default router;
