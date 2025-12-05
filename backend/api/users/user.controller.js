import { loadDB, saveDB } from "../../utils/mockDB.js";
import { v4 as uuidv4 } from "uuid";

export function createUser(req, res) {
  const users = loadDB("users.db.json");

  const newUser = {
    id: uuidv4(),
    username: req.body.username,
    email: req.body.email,
    role: req.body.role,
    organization: req.body.organization,
    permissions: req.body.permissions || [],
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  users.push(newUser);
  saveDB("users.db.json", users);

  res.json({ user: newUser });
}

export function getUser(req, res) {
  const users = loadDB("users.db.json");
  const user = users.find(u => u.id === req.params.userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ user });
}

export function updateUserRole(req, res) {
  const users = loadDB("users.db.json");
  const index = users.findIndex(u => u.id === req.params.userId);

  if (index === -1) return res.status(404).json({ error: "User not found" });

  users[index].role = req.body.role;
  users[index].updatedAt = Date.now();

  saveDB("users.db.json", users);

  res.json({ user: users[index] });
}
