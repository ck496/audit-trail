import express from "express";
import {
  logAudit,
  getAllAudits,
  getAuditsByUser
} from "../controllers/auditController.js";

const router = express.Router();

router.post("/log", logAudit);
router.get("/all", getAllAudits);
router.get("/user/:id", getAuditsByUser);

export default router;
