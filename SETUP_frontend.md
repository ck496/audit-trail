# Audit Trail Dashboard

A React-based frontend dashboard for the Audit Trail Hyperledger Fabric application. This dashboard provides a user-friendly interface to manage users, view immutable audit logs, and generate compliance reports.

## Features

- **User Management**: Register new users with role-based access control (Admin, Auditor, User) and manage permissions.
- **Audit Logs**: View and query immutable audit trails by User ID, Action Type, or Date Range.
- **Compliance Reports**: Generate and view compliance reports for standards like SOC2, HIPAA, and GDPR.
- **Real-time Statistics**: View summary statistics of audit activities.

## How to run

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:

```bash
npm start
```

## API Integration

The frontend expects a backend API running at `http://localhost:5008` (configurable in `src/services/api.js`).

**Key Endpoints:**

- `POST /api/users` - Register a new user
- `GET /api/audit` - Fetch audit logs
- `GET /api/audit/user/:userId` - Query audits by user
- `POST /api/reports` - Generate compliance report
