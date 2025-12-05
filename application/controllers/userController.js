import { getContract } from "../fabric/fabricConnect.js";
/**
 * Tis module allows you to invoke audit-trail chaincode to do CRUD on USERS on the ledger
 * - Check chaincode-go/audit-chaincode/chaincode/users.go to understand the chaincode
 */

/**
 * Register a new user
 * POST /users/register
 *
 * Calls Chaincode function: RegisterUser(id, name, email, role, organization, createdBy)
 */
export async function registerUser(req, res) {
  try {
    const { id, name, email, role, organization, createdBy } = req.body;

    // Validate required fields
    if (!id || !name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: id, name, email, role",
      });
    }

    const contract = await getContract();

    // Call chaincode with 6 parameters
    await contract.submitTransaction(
      "RegisterUser",
      id,
      name,
      email,
      role,
      organization || "",
      createdBy || ""
    );

    res.json({
      success: true,
      message: "User registered successfully",
      userId: id,
    });
  } catch (error) {
    console.error("[UserControler]: Error registering user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register user",
      details: error.message,
    });
  }
}

/**
 * Get user by ID
 * GET /users/:id
 *
 *
 * Calls Chaincode function: GetUser(id string) returns *User
 */
export async function getUser(req, res) {
  try {
    const { id } = req.params;

    const contract = await getContract();
    const result = await contract.evaluateTransaction("GetUser", id);

    // Parse JSON response
    const user = JSON.parse(result.toString());

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("[UserControler]: Error getting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user",
      details: error.message,
    });
  }
}

/**
 * Update user role
 * PUT /users/:id/role
 *
 * Calls chaincode function: UpdateUserRole(id string, newRole string)
 */
export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: newRole",
      });
    }

    const contract = await getContract();
    await contract.submitTransaction("UpdateUserRole", id, newRole);

    res.json({
      success: true,
      message: "User role updated successfully",
      userId: id,
      newRole,
    });
  } catch (error) {
    console.error("[UserControler]: Error updating user role:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
      details: error.message,
    });
  }
}

/**
 * Deactivate user (soft delete)
 * DELETE /users/:id
 *
 * Calls chaincode function: DeactivateUser(id string)
 * - This does a soft deelte btw
 */
export async function deactivateUser(req, res) {
  try {
    const { id } = req.params;

    const contract = await getContract();
    await contract.submitTransaction("DeactivateUser", id);

    res.json({
      success: true,
      message: "User deactivated successfully",
      userId: id,
    });
  } catch (error) {
    console.error("[UserControler]: Error deactivating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to deactivate user",
      details: error.message,
    });
  }
}

/**
 * Check if user exists
 * GET /users/exists/:id
 *
 * call chaincode function: UserExists(id string) returns bool
 */
export async function userExists(req, res) {
  try {
    const { id } = req.params;

    const contract = await getContract();
    const result = await contract.evaluateTransaction("UserExists", id);

    // Convert buffer to string and parse boolean
    const exists = result.toString() === "true";

    res.json({
      success: true,
      userId: id,
      exists,
    });
  } catch (error) {
    console.error("[UserControler]: Error checking user existence:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check user existence",
      details: error.message,
    });
  }
}
