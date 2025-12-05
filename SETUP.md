# AuditTrail - Complete Setup & Deployment Guide

**For graders, professors, and fresh deployments**

This guide walks you through setting up the Hyperledger Fabric network, deploying the audit trail chaincode, and testing all functionality from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Start the Fabric Network](#start-the-fabric-network)
4. [Build & Deploy Chaincode](#build--deploy-chaincode)
5. [Test Chaincode Functions](#test-chaincode-functions)
6. [Troubleshooting](#troubleshooting)
7. [Shutdown & Cleanup](#shutdown--cleanup)

---

## Prerequisites

Source:

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Using Fabric Test network](https://hyperledger-fabric.readthedocs.io/en/release-2.5/test_network.html)

### Required Software

| Software           | Minimum Version | Check Command      |
| ------------------ | --------------- | ------------------ |
| **Docker Desktop** | 20.10+          | `docker --version` |
| **Go**             | 1.25.4          | `go version`       |
| **Git**            | 2.0+            | `git --version`    |

### Install Missing Prerequisites

**macOS:**

```bash
# Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/

# Go
brew install go

# Git (usually pre-installed)
brew install git
```

**Linux:**

```bash
# Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Go
wget https://go.dev/dl/go1.23.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# Git
sudo apt-get install git
```

### Verify Installations

Run these commands to verify everything is installed:

```bash
# Check Docker
docker --version
# Expected: Docker version 20.10.x or higher

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 2.x or higher

# Check Go
go version
# Expected: go version go1.23 or higher

# Check Git
git --version
# Expected: git version 2.x or higher

# Verify Docker is running
docker ps
# Expected: Should list running containers (or empty list, but no error)
```

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ck496/audit-trail.git
cd audit-trail
```

### 2. Verify Project Structure

```bash
ls -la
```

**Expected output should include:**

```
chaincode-go/        # Go chaincode (smart contracts)
network/             # Fabric network scripts and binaries
application/         # Backend API
frontend/            # React dashboard
README.md
SETUP.md             # This file
```

### 3. Verify Network Files

```bash
ls -la network/
```

**Expected:**

```
bin/                 # Fabric binaries (peer, orderer, etc.)
config/              # Fabric configuration files
test-network/        # Network startup scripts
```

---

## Start the Fabric Network

### Step 1: Clean Any Existing Network

**Important:** Always start with a clean slate to avoid conflicts.

```bash
cd network/test-network

# Clean up any existing containers, volumes, and crypto material
./network.sh down
```

**Expected output:**

```
Stopping network
Removing containers...
Removing volumes...
Done
```

### Step 2: Start Network with CouchDB

```bash
./network.sh up createChannel -c audit-channel -ca -s couchdb
```

**What this does:**

- `up` - Starts the Fabric network
- `createChannel` - Creates the channel for ledger sharing
- `-c audit-channel` - Names the channel "audit-channel"
- `-ca` - Starts Certificate Authorities for identity management
- `-s couchdb` - Uses CouchDB as the state database (enables rich queries)

**Expected output (final lines):**

```
========= Channel successfully joined ===========
Channel 'audit-channel' created
```

### Step 3: Verify Network is Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Expected containers (you should see at least these 7):**

```
NAMES                                STATUS         PORTS
peer0.org1.example.com              Up X minutes   7051/tcp, ...
peer0.org2.example.com              Up X minutes   9051/tcp, ...
orderer.example.com                 Up X minutes   7050/tcp, ...
couchdb0                            Up X minutes   5984/tcp
couchdb1                            Up X minutes   7984/tcp
ca_org1                             Up X minutes   7054/tcp
ca_org2                             Up X minutes   8054/tcp
```

✅ **All containers running?** Proceed to chaincode deployment.

❌ **Containers missing or exited?** See [Troubleshooting](#troubleshooting).

---

## Build & Deploy Chaincode

### Step 1: Navigate to Chaincode Directory

```bash
cd ../../chaincode-go/audit-chaincode
pwd
```

**Expected output:**

```
/path/to/audit-trail/chaincode-go/audit-chaincode
```

### Step 2: Build Chaincode Docker Image

```bash
docker build -t audit-trail-chaincode:1.0 .
```

**What this does:**

- Compiles Go chaincode into a binary
- Packages it into a minimal Docker image
- Includes CouchDB index definitions from `META-INF/statedb/couchdb/indexes/`

**Expected output (final lines):**

```
=> exporting to image
=> => naming to docker.io/library/audit-trail-chaincode:1.0
```

**Verify image was created:**

```bash
docker images | grep audit-trail-chaincode
```

**Expected:**

```
audit-trail-chaincode   1.0   <image-id>   X seconds ago   ~43MB
```

### Step 3: Deploy Chaincode via CCAAS

```bash
cd ../../network/test-network

./network.sh deployCCAAS \
  -ccn audit-trail \
  -ccp ../../chaincode-go/audit-chaincode \
  -c audit-channel
```

**What this does:**

- `-ccn audit-trail` - Names the chaincode "audit-trail"
- `-ccp ../../chaincode-go/audit-chaincode` - Path to chaincode directory
- `-c audit-channel` - Deploys to "audit-channel"

#### What Happens in Detail:

Detailed Steps
**1. Build Docker Image**
Runs docker build on your Dockerfile
Creates audit-trail_ccaas_image:latest
Contains compiled Go chaincode binary

**2. Start Chaincode Containers**
Starts container for Org1: peer0org1_audit-trail_ccaas
Starts container for Org2: peer0org2_audit-trail_ccaas
Both run on port 9999
Connected to fabric_test network

**3. Package Chaincode**
Creates connection.json with gRPC address: peer0org1_audit-trail_ccaas:9999
Packages into audit-trail.tar.gz
Calculates Package ID (hash)

**4. Install on Peers**
Copies package to Org1's peer: peer0.org1.example.com
Copies package to Org2's peer: peer0.org2.example.com
Peers now know how to connect to chaincode containers

**5. Approve Chaincode Definition**
Org1 admin approves: "Yes, use this chaincode on audit-channel"
Org2 admin approves: "Yes, use this chaincode on audit-channel"

**6. Commit to Channel**
Once both orgs approve → commit definition to audit-channel
Chaincode is now "live" on the blockchain network
All peers can execute transactions

**7. Peers Connect to Containers**
Peers use connection.json to find containers at :9999
Establish gRPC connection
Ready to execute transactions

**Result**
✅ Chaincode running in 2 containers (Org1, Org2)
✅ Installed on 2 peers (peer0.org1, peer0.org2)
✅ Committed on channel audit-channel
✅ Ready to process transactions

**Expected output (final lines):**

```
Chaincode is packaged
Installing chaincode on peer0.org1...
Installing chaincode on peer0.org2...
Approving chaincode definition for org1...
Approving chaincode definition for org2...
Committing chaincode definition...
Chaincode definition committed
Query chaincode definition successful
```

### Step 4: Verify Chaincode Deployment

**Check chaincode containers are running:**

```bash
docker ps --filter "name=audit-trail"
```

**Expected (2 containers):**

```
peer0org1_audit-trail_ccaas
peer0org2_audit-trail_ccaas
```

**Verify chaincode is committed:**

```bash
# configure peer CLI binaries, add them to path (from audit-trail/network/test-network)
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

peer lifecycle chaincode querycommitted -C audit-channel -n audit-trail
```

**Expected output:**

```
Committed chaincode definition for chaincode 'audit-trail' on channel 'audit-channel':
Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc
```

---

## Test Chaincode Functions

### Step 1: Set Environment Variables (Org1)

**Copy and paste this entire block:**

```bash
cd /path/to/audit-trail/network/test-network

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

**Verify environment is set:**

```bash
echo $CORE_PEER_ADDRESS
```

**Expected:** `localhost:7051`

### Step 2: Initialize Ledger with Sample Data

```bash
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
```

**Expected output:**

```
Chaincode invoke successful. result: status:200
```

### Step 3: Test Basic Query Functions

**Test 1: Get a specific audit entry**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"GetAudit","Args":["audit-001"]}'
```

**Expected:** JSON object with audit details (userId: "user-alice", action: "CREATE", etc.)

**Test 2: Get all audit entries**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"GetAllAudits","Args":[]}'
```

**Expected:** Array with 2 audit entries (audit-001, audit-002)

**Test 3: Check if audit exists**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"AuditExists","Args":["audit-001"]}'
```

**Expected:** `true`

### Step 4: Test Rich Queries (CouchDB) -- IGNORE FOR NOW, NOT IMPLEMENTED YET --

**Test 4: Query audits by user**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByUser","Args":["user-alice"]}'
```

**Expected:** Array with audit entries for user-alice

**Test 5: Query audits by action type**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByAction","Args":["CREATE"]}'
```

**Expected:** Array with all CREATE action entries

**Test 6: Query audits by date range**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByDateRange","Args":["1704067200000","1767225600000"]}'
```

**Expected:** Array with entries within the date range (Jan 2024 - Dec 2025)

### Step 5: Test Write Operations

**Test 7: Create a new audit entry**

```bash
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
  -c '{"function":"LogAudit","Args":["audit-003","user-charlie","STUDENT","VERIFY","CREDENTIAL","cred-diploma-001","","","SUCCESS","192.168.1.102","sess-003","{\"requestor\":\"employer-techcorp\"}","FERPA"]}'
```

**Expected:** `status:200`

**Verify the new entry was created:**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"GetAudit","Args":["audit-003"]}'
```

**Expected:** JSON object with the new audit entry details

✅ **All tests passed?** Your chaincode is working correctly!

📝 **For more test commands:** See `chaincode-go/audit-chaincode/chaincodeTestingCMDS.md`

---

## Troubleshooting

### Issue: Docker containers not starting

**Symptoms:**

```
Error: Cannot connect to Docker daemon
```

**Solution:**

1. Verify Docker Desktop is running: `docker ps`
2. Restart Docker Desktop
3. Try again: `./network.sh up createChannel -c audit-channel -ca -s couchdb`

---

### Issue: Port already in use

**Symptoms:**

```
Error: Bind for 0.0.0.0:7051 failed: port is already allocated
```

**Solution:**

1. Clean up existing network: `./network.sh down`
2. Remove all containers: `docker rm -f $(docker ps -aq)`
3. Start fresh: `./network.sh up createChannel -c audit-channel -ca -s couchdb`

---

### Issue: Chaincode deployment fails

**Symptoms:**

```
Error: chaincode install failed
```

**Solution:**

1. Check chaincode image exists: `docker images | grep audit-trail-chaincode`
2. If missing, rebuild: `cd ../../chaincode-go/audit-chaincode && docker build -t audit-trail-chaincode:1.0 .`
3. Remove old chaincode containers: `docker ps -a --filter "name=audit-trail" -q | xargs docker rm -f`
4. Redeploy: `./network.sh deployCCAAS -ccn audit-trail -ccp ../../chaincode-go/audit-chaincode -c audit-channel`

---

### Issue: Rich queries fail with "no_usable_index"

**Symptoms:**

```
Error: no_usable_index, No index exists for this sort
```

**Solution:**
This means CouchDB indexes weren't deployed. Verify:

1. Check indexes exist in chaincode: `ls chaincode-go/audit-chaincode/META-INF/statedb/couchdb/indexes/`
2. Expected files: `indexUserId.json`, `indexAction.json`, `indexTimestamp.json`
3. Rebuild chaincode image: `docker build -t audit-trail-chaincode:1.0 .`
4. Redeploy chaincode (indexes deploy automatically)

---

### Issue: "ProposalResponsePayloads do not match"

**Symptoms:**

```
Error: ProposalResponsePayloads do not match
```

**Cause:** Non-deterministic code (like `time.Now()`) in chaincode

**Solution:**
This should already be fixed in the codebase (using `ctx.GetStub().GetTxTimestamp()` instead). If you see this error:

1. Verify you're using the latest code: `git pull`
2. Rebuild chaincode: `docker build -t audit-trail-chaincode:1.0 .`
3. Redeploy

---

### View Chaincode Logs

**To debug chaincode execution:**

```bash
# View logs for Org1 chaincode container
docker logs -f peer0org1_audit-trail_ccaas

# View logs for Org2 chaincode container
docker logs -f peer0org2_audit-trail_ccaas

# View peer logs
docker logs -f peer0.org1.example.com
```

---

### View CouchDB UI

**To inspect the ledger database:**

1. Open browser: `http://localhost:5984/_utils`
2. Login: `admin` / `adminpw`
3. Select database: `audit-channel`
4. View documents (audit entries)

---

## Shutdown & Cleanup

### Clean Shutdown

```bash
cd network/test-network

# Stop network and remove all containers/volumes
./network.sh down
```

**What this does:**

- Stops all Fabric containers
- Removes containers and volumes
- Cleans up crypto material
- Preserves the chaincode image (for faster restart)

### Complete Cleanup (Fresh Start)

**If you want to remove EVERYTHING including Docker images:**

```bash
cd network/test-network

# Stop network
./network.sh down

# Remove chaincode containers
docker ps -a --filter "name=audit-trail" -q | xargs docker rm -f

# Remove chaincode image
docker rmi audit-trail-chaincode:1.0

# Remove all unused Docker resources
docker system prune -a
```

**Warning:** This removes all unused Docker images, not just Fabric ones.

---

## Quick Reference

### Restart Everything (Network Already Down)

**IMPORTANT**: Make sure you have completed the prerequisites and have all the right libraries

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
