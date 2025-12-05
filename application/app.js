import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import auditRoutes from "./routes/auditRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { connectGateway, disconnect } from "./fabric/fabricConnect.js";

dotenv.config(); //load env vars
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/audit", auditRoutes);
app.use("/users", userRoutes);

// Root endpoint - shows available endpoints to call
app.get("/", (req, res) => {
  res.json({
    message: "AuditTrail REST API is running...",
    status: "connected to Fabric network",
    endpoints: {
      audit: [
        "POST /audit/init - Initialize ledger with sample data",
        "POST /audit/log - Log new audit entry",
        "GET /audit/exists/:id - Check if audit exists",
        "GET /audit/:id - Get specific audit by ID",
        "GET /audit/all - Get all audit entries",
      ],
      users: [
        "POST /users/register - Register new user",
        "GET /users/exists/:id - Check if user exists",
        "GET /users/:id - Get user by ID",
        "PUT /users/:id/role - Update user role",
        "DELETE /users/:id - Deactivate user",
      ],
    },
  });
});

const PORT = process.env.PORT || 5008;

const server = app.listen(PORT, async () => {
  console.log(`[APP.js]: Server running on port ${PORT}`);
  console.log(`[APP.js]: Connecting to Fabric network...`);

  try {
    await connectGateway();
    console.log(`[APP.js]: Successfully connected to Fabric network`);
    console.log(`[APP.js]: API ready at http://localhost:${PORT}`);
    console.log(
      `[APP.js]: Call http://localhost:${PORT}/ for available endpoints`
    );
  } catch (error) {
    console.error(
      `[APP.js]: Failed to connect to Fabric network: ${error.message}`
    );
    console.error(`[APP.js]: Server will run but requests will fail`);
  }
});

// Graceful shutdown - disconnect from Fabric when server stops
// Handle docker stop container
process.on("SIGTERM", async () => {
  console.log("\n[APP.js]: SIGTERM received, shutting down gracefully...");
  await disconnect();
  server.close(() => {
    console.log("[APP.js]: Server closed");
    process.exit(0);
  });
});

// handle Ctrl+C (interrupt) shuut down
process.on("SIGINT", async () => {
  console.log("\n[APP.js]: SIGINT received, shutting down gracefully...");
  await disconnect();
  server.close(() => {
    console.log("[APP.js]: Server closed");
    process.exit(0);
  });
});
