import express from "express";
import cors from "cors";

import userRoutes from "./api/users/user.routes.js";
import auditRoutes from "./api/audit/audit.routes.js";
import reportRoutes from "./api/reports/report.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/reports", reportRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
