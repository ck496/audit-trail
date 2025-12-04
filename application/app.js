import express from "express";
import cors from "cors";

import auditRoutes from "./routes/auditRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/audit", auditRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.send("AuditTrail REST API is running...");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
