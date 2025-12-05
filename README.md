# AuditTrail

AuditTrail is a **decentralized Identity and Access Management system** built with Hyperledger Fabric that:

- Immutably logs all system activities
- Supports multi-organization access control
- Detects anomalies and suspicious activities
- Offers real-time audit streaming
- Enables tamper-proof record keeping

_AuditTrail gives you complete visibility and control over your credentials_

---

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

---

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

---

## Part 2: REST API Backend

Python REST API to hit with Fabric network and fetch audit logs

---

## Part 3: React Frontend

React frontend to see your audit logs

---

## Consumption Guide

### Running the Network and Chaincode

See `SETUP.md` for more details

**IMPORTANT**: Make sure you have completed the prerequisites from `SETUP.md`

```bash
# 0. Open Detailed Logs monitor to see whats happening on the network
cd network/test-network
./monitordocker.sh fabric_test

# 1. Start network
cd network/test-network
./network.sh up createChannel -c audit-channel -ca -s couchdb

# 2. Build chaincode (if not already built)
cd ../../chaincode-go/audit-chaincode
docker build -t audit-trail-chaincode:1.0 .

# 3. Deploy chaincode
cd ../../network/test-network
./network.sh deployCCAAS -ccn audit-trail -ccp ../../chaincode-go/audit-chaincode -c audit-channel
# 3.1 Verify Chaincode Deployment
docker ps --filter "name=audit-trail"
#3.2 **Verify chaincode is committed:**
#   - configure peer CLI binaries, add them to path
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

peer lifecycle chaincode querycommitted -C audit-channel -n audit-trail

### 5: Set Environment Variables for peer/org1
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# 5. Initialize ledger - call chaincode's InitLedger and load init data
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C audit-channel \
  -n audit-trail \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"InitLedger","Args":[]}'

# 6. Test by getting all audits
peer chaincode query -C audit-channel -n audit-trail -c '{"function":"GetAllAudits","Args":[]}'

```

## Used Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Using Fabric Test network](https://hyperledger-fabric.readthedocs.io/en/release-2.5/test_network.html)
- [Fabric Contract API Go](https://pkg.go.dev/github.com/hyperledger/fabric-contract-api-go/v2)
- [CCAAS Tutorial](https://github.com/hyperledger/fabric-samples/blob/main/test-network/CHAINCODE_AS_A_SERVICE_TUTORIAL.md)
  [Fabric SDK Node.js](https://hyperledger.github.io/fabric-sdk-node/)
