# Chaincode Testing Commands

## Prerequisites

Set Org1 environment variables:

```bash
cd /Users/chriskurian/go/src/github.com/ck496/audit-trail/network/test-network

export PATH=${PWD}/../../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

---

## Command Templates

### INVOKE (Write Operation)

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
  -c '{"function":"FUNCTION_NAME","Args":["arg1","arg2"]}'
```

### QUERY (Read Operation)

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"FUNCTION_NAME","Args":["arg1","arg2"]}'
```

---

## Test Commands

### 1. InitLedger (INVOKE)

**Creates 2 sample audit entries**

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

---

### 2. GetAudit (QUERY)

**Retrieve single audit entry by ID**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"GetAudit","Args":["audit-001"]}'
```

---

### 3. GetAllAudits (QUERY)

**Retrieve all audit entries**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"GetAllAudits","Args":[]}'
```

---

### 4. AuditExists (QUERY)

**Check if audit entry exists**

```bash
# Exists (returns true)
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"AuditExists","Args":["audit-001"]}'

# Not exists (returns false)
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"AuditExists","Args":["audit-999"]}'
```

---

### 5. LogAudit (INVOKE)

**Create new audit entry**

**Args:** `id, userId, userRole, action, resourceType, resourceId, oldValue, newValue, status, ipAddress, sessionId, metadata, complianceTag`

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

**Verify:**

```bash
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"GetAudit","Args":["audit-003"]}'
```

---

### 6. QueryAuditsByUser (QUERY)

**Get all audits for specific user**

```bash
# Query user-alice
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByUser","Args":["user-alice"]}'

# Query user-bob
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByUser","Args":["user-bob"]}'
```

---

### 7. QueryAuditsByAction (QUERY)

**Get all audits by action type**

```bash
# Query CREATE actions
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByAction","Args":["CREATE"]}'

# Query VERIFY actions
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByAction","Args":["VERIFY"]}'

# Query QUERY actions
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByAction","Args":["QUERY"]}'
```

---

### 8. QueryAuditsByDateRange (QUERY)

**Get audits within timestamp range (milliseconds)**

```bash
# Wide range (Jan 1, 2024 - Dec 31, 2025)
peer chaincode query -C audit-channel -n audit-trail \
  -c '{"function":"QueryAuditsByDateRange","Args":["1704067200000","1767225600000"]}'
```
