import { loadDB, saveDB } from "../../utils/mockDB.js";
import { v4 as uuidv4 } from "uuid";

export function logAudit(req, res) {
  const audits = loadDB("audits.db.json");

  const entry = {
    id: uuidv4(),
    timestamp: Date.now(),
    userId: req.body.userId,
    userRole: req.body.userRole,
    action: req.body.action,
    resourceType: req.body.resourceType,
    resourceId: req.body.resourceId,
    status: req.body.status,
    complianceTag: req.body.complianceTag,
    ipAddress: req.body.ipAddress,
    oldValue: req.body.oldValue,
    newValue: req.body.newValue
  };

  audits.push(entry);
  saveDB("audits.db.json", audits);

  res.json({ audit: entry });
}

export function getAllAudits(req, res) {
  const audits = loadDB("audits.db.json");
  res.json({ audits });
}

export function getAuditById(req, res) {
  const audits = loadDB("audits.db.json");
  const audit = audits.find(a => a.id === req.params.auditId);

  if (!audit) return res.status(404).json({ error: "Audit not found" });

  res.json({ audit });
}

export function getAuditsByUser(req, res) {
  const audits = loadDB("audits.db.json");
  res.json({ audits: audits.filter(a => a.userId === req.params.userId) });
}

export function getAuditsByAction(req, res) {
  const audits = loadDB("audits.db.json");
  res.json({ audits: audits.filter(a => a.action === req.params.action) });
}

export function getAuditsByDateRange(req, res) {
  const audits = loadDB("audits.db.json");
  const { start, end } = req.query;

  res.json({
    audits: audits.filter(
      a => a.timestamp >= Number(start) && a.timestamp <= Number(end)
    )
  });
}
