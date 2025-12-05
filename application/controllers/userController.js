import { getContract } from "../fabric/fabricConnectMOCK.js";

export async function registerUser(req, res) {
  try {
    const { userId, name, role } = req.body;

    const contract = await getContract();

    const result = await contract.submitTransaction(
      "RegisterUser",
      userId,
      name,
      role
    );

    res.json({
      success: true,
      message: "User Registered",
      data: result.toString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUser(req, res) {
  try {
    const userId = req.params.id;

    const contract = await getContract();
    const result = await contract.evaluateTransaction("GetUser", userId);

    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
