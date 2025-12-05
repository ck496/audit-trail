import { loadDB, saveDB } from "../../utils/mockDB.js";
import { v4 as uuidv4 } from "uuid";

export function createReport(req, res) {
  const reports = loadDB("reports.db.json");

  const report = {
    id: uuidv4(),
    reportType: req.body.reportType,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    generatedAt: Date.now(),
    totalEntries: 0,
    anomaliesFound: 0,
    status: "COMPLETED"
  };

  reports.push(report);
  saveDB("reports.db.json", reports);

  res.json({ report });
}

export function getAllReports(req, res) {
  const reports = loadDB("reports.db.json");
  res.json({ reports });
}

export function getReportById(req, res) {
  const reports = loadDB("reports.db.json");
  const report = reports.find(r => r.id === req.params.reportId);

  if (!report) return res.status(404).json({ error: "Report not found" });

  res.json({ report });
}
