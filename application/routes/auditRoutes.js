import express from "express";
import {
  initLedger,
  logAudit,
  getAudit,
  auditExists,
  getAllAudits,
} from "../controllers/auditController.js";

const router = express.Router();

// Initialize ledger with sample data - Chaincode does this, just invoke it
router.post("/init", initLedger);

// Log new an audit entry
router.post("/log", logAudit);

// Check if an audit exists
router.get("/exists/:id", auditExists);

// Get all audits from ledger
router.get("/all", getAllAudits);

// Get specific audit by ID
router.get("/:id", getAudit);

export default router;
