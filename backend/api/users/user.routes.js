import express from "express";
import {
  createUser,
  getUser,
  updateUserRole
} from "./user.controller.js";

const router = express.Router();

router.post("/", createUser);
router.get("/:userId", getUser);
router.put("/:userId/role", updateUserRole);

export default router;
