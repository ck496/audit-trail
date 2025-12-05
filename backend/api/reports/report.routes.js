import express from "express";
import {
  createReport,
  getAllReports,
  getReportById
} from "./report.controller.js";

const router = express.Router();

router.post("/", createReport);
router.get("/", getAllReports);
router.get("/:reportId", getReportById);

export default router;
