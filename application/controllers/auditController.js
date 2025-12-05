import { getContract } from "../fabric/fabricConnectMOCK.js";

// MOCKED AUDIT CONTROLLER

export async function logAudit(req, res) {
  try {
    const { userId, action, description } = req.body;

    const contract = await getContract();
    const result = await contract.submitTransaction(
      "LogAudit",
      userId,
      action,
      description
    );

    res.json({
      message: "Audit logged (MOCK)",
      result: JSON.parse(result),
    });
  } catch (error) {
    console.error("Error logging audit:", error);
    res.status(500).json({ error: "Failed to log audit" });
  }
}

export async function getAllAudits(req, res) {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction("QueryAllAudits");

    res.json(JSON.parse(result));
  } catch (error) {
    console.error("Error retrieving audits:", error);
    res.status(500).json({ error: "Failed to fetch audits" });
  }
}

export async function getAuditsByUser(req, res) {
  try {
    const { id } = req.params;

    const contract = await getContract();
    const result = await contract.evaluateTransaction("QueryAuditByUser", id);

    res.json(JSON.parse(result));
  } catch (error) {
    console.error("Error retrieving user audits:", error);
    res.status(500).json({ error: "Failed to fetch user audits" });
  }
}
