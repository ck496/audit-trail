import { getContract } from "../fabric/fabricConnect.js";

/**
 * Module allows you to invoke audit-teail chaincode to do CRUD on AUDITS on the ledger
 *  - Check chaincode-go/audit-chaincode/chaincode/audits.go to understand the chaincode
 */

/**
 * Initialize ledger with sample data
 * POST /audit/init
 *
 * Call Chaincode function: InitLedger()
 */
export async function initLedger(req, res) {
  try {
    const contract = await getContract();
    await contract.submitTransaction("InitLedger");

    res.json({
      success: true,
      message: "Ledger initialized with sample audit entries",
    });
  } catch (error) {
    console.error("[AuditController]: ERROR initializing ledger:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize ledger",
      details: error.message,
    });
  }
}

/**
 * Log a new audit entry
 * POST /audit/log
 *
 * Calls Chaincode function: LogAudit(id, userId, userRole, action, resourceType,
 *                               resourceId, oldValue, newValue, status, ipAddress,
 *                               sessionId, metadata, complianceTag)
 *
 * Body: NEEDS ALL 13 parameters from models.go AuditEntry
 */
export async function logAudit(req, res) {
  try {
    const {
      id,
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      oldValue,
      newValue,
      status,
      ipAddress,
      sessionId,
      metadata,
      complianceTag,
    } = req.body;

    // Validate required fields
    if (!id || !userId || !userRole || !action) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: id, userId, userRole, action",
      });
    }

    const contract = await getContract();

    // Call chaincode with all needed params
    await contract.submitTransaction(
      "LogAudit",
      id,
      userId,
      userRole,
      action,
      resourceType || "",
      resourceId || "",
      oldValue || "",
      newValue || "",
      status || "SUCCESS",
      ipAddress || "",
      sessionId || "",
      metadata || "{}",
      complianceTag || ""
    );

    res.json({
      success: true,
      message: "Audit entry logged successfully",
      auditId: id,
    });
  } catch (error) {
    console.error("[AuditController]: ERROR logging audit:", error);
    res.status(500).json({
      success: false,
      error: "Failed to log audit",
      details: error.message,
    });
  }
}

/**
 * Check if an audit entry exists
 * GET /audit/exists/:id
 *
 * Callss Chaincode function: AuditExists(id string) returns bool
 */
export async function auditExists(req, res) {
  try {
    const { id } = req.params;

    const contract = await getContract();
    const result = await contract.evaluateTransaction("AuditExists", id);

    // Convert buffer to string and parse boolean
    const exists = result.toString() === "true";

    res.json({
      success: true,
      auditId: id,
      exists,
    });
  } catch (error) {
    console.error("[AuditController]: Error checking audit existence:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check audit existence",
      details: error.message,
    });
  }
}

/**
 * Get specific audit entry by ID
 * GET /audit/:id
 *
 * Calls Chaincode function: GetAudit(id string) returns *AuditEntry
 */
export async function getAudit(req, res) {
  try {
    const { id } = req.params;

    const contract = await getContract();
    const result = await contract.evaluateTransaction("GetAudit", id);

    // Parse JSON response from chaincode
    const audit = JSON.parse(result.toString());

    res.json({
      success: true,
      data: audit,
    });
  } catch (error) {
    console.error("[AuditController]: Error getting audit:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get audit",
      details: error.message,
    });
  }
}

/**
 * Get all audit entries
 * GET /audit/all
 *
 * calls chaincode function: GetAllAudits() returns []*AuditEntry
 */
export async function getAllAudits(req, res) {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction("GetAllAudits");

    // Parse JSON array response
    const audits = JSON.parse(result.toString());

    res.json({
      success: true,
      count: audits.length,
      data: audits,
    });
  } catch (error) {
    console.error("[AuditController]: Error getting all audits:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get audits",
      details: error.message,
    });
  }
}
