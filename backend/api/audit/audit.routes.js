import express from "express";
import {
  logAudit,
  getAllAudits,
  getAuditById,
  getAuditsByUser,
  getAuditsByAction,
  getAuditsByDateRange
} from "./audit.controller.js";

const router = express.Router();

router.post("/", logAudit);
router.get("/", getAllAudits);
router.get("/:auditId", getAuditById);
router.get("/user/:userId", getAuditsByUser);
router.get("/action/:action", getAuditsByAction);
router.get("/daterange", getAuditsByDateRange);

export default router;
