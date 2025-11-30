# AuditTrail

AuditTrail is a **decentralized Identity and Access Management system** built with Hyperledger Fabric that:

- Immutably logs all system activities
- Supports multi-organization access control
- Detects anomalies and suspicious activities
- Offers real-time audit streaming
- Enables tamper-proof record keeping

_AuditTrail gives you complete visibility and control over your credentials_

## Architecture

**AuditTrail** is a permissioned blockchain network built on Hyperledger Fabric that provides:

- **Immutable audit logging** of credential access events
- **Role-based access control** (Admin, Auditor, User)
- **CouchDB rich queries** for flexible audit trail searches
- **CCAAS deployment** for production-ready chaincode

**Components:**

- **Chaincode (Go)**: Smart contracts for audit logging and user management
- **Fabric Network**: 2 organizations, 1 orderer, CouchDB state database
- **Backend API (Node.js)**: REST interface with Fabric SDK
- **Frontend (React)**: Dashboard for viewing audit trails

## Part 1: Blockchain

You can find all the

- `network/`: contains the scripts, binaries needed to bring up the Fabric Network
- `chaincode-go/`: contains GO based smart contracts and chaincode + Docker files for chaincode deployment

### The Network

**Test Network Configuration:**

- **Organizations**: Org1, Org2 (each with 1 peer)
- **Orderer**: Single orderer using Raft consensus
- **Channel**: `audit-channel` (shared ledger)
- **State Database**: CouchDB (enables rich queries)
- **Chaincode**: `audit-trail` deployed via CCAAS

### Chain code

**Two Contracts:**

**AuditContract** - Immutable audit trail management

- `LogAudit()` - Create audit entry (append-only)
- `GetAudit()` - Retrieve specific entry
- `QueryAuditsByUser()` - Search by user
- `QueryAuditsByDateRange()` - Search by time
- `QueryAuditsByAction()` - Filter by action type

**UserContract** - User and role management

- `RegisterUser()` - Create user with role-based permissions
- `GetUser()` - Retrieve user details
- `UpdateUserRole()` - Change user role and permissions
- `DeactivateUser()` - Soft delete user

**Tech Stack:** Go 1.25.4, Fabric Contract API v2.2.0

### Deployment

We use **Chaincode-as-a-Service (CCAAS)** instead of the traditional Docker-in-Docker based deployment method for model for building and deploying chain code as it is industry best practice and better for production ready.

Traditional
Peer → Receives source code → Builds internally = ERROR PRONE

CCAAS (production-ready)
YOU build image externally → Peer connects to pre-built container via gRPC

#### Docker

The `Dockerfile`

- Builds your chaincode into a Docker container image
- Creates a standalone, runnable service
- Peer connects to this container (not builds it)

Multi-Stage Docker Build:

- Stage 1 (Builder): Heavy image with Go compiler, build tools
- Stage 2 (Runtime): Minimal Alpine Linux, just the compiled binary

## Part 2: REST API Backend

Python REST API to hit with Fabric network and fetch audit logs

## Part 3: React Frontend

React frontend to see your audit logs

## Consumption Guide

### Running the Network and Chaincode

**Start Network:**

```bash
cd network/test-network
./network.sh up createChannel -c audit-channel -s couchdb
```

**Build Docker Image:**

```bash
cd chaincode-go/audit-chaincode
docker build -t audit-trail-cc:1.0 .

# Deploy contracts and chaincode via CCAAS:
cd network/test-network
./network.sh deployCCAAS \
  -ccn audit-trail \
  -ccp ../../chaincode-go/audit-chaincode \
  -c audit-channel

# Verify:
docker ps | grep audit-trail  # Should see 2 containers (org1, org2)

peer lifecycle chaincode querycommitted -C audit-channel -n audit-trail
```
