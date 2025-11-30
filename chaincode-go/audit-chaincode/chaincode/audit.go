package chaincode

import (
	"encoding/json"
	"fmt"
	"log"

	// import hyperledger fabric SDK for writing go chaincode, provides interfaces:
	//  - contractapi.Contract : base struct for contracts
	//	- contractapi.TransactionContextInterface : alows you to read/write ledger state
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

/*
 ----- MODULE NOTES: -----
 audits.go holds all the code for audit related interactions with the ledger:
	- AuditContract struct (the main contract)
	- Basic CRUD functions: InitLedger, LogAudit, GetAudit, AuditExists, GetAllAudits
	- Rich Query functions: QueryAuditsByUser, QueryAuditsByDateRange, QueryAuditsByAction

Uses hyperledger fabric SDK for writing go chaincode
	- contractapi.Contract : base struct for contracts
	- contractapi.TransactionContextInterface (ctx): alows you to read/write ledger state
		ctx.GetStub():
		GetStub().PutState(key, value) - Write to blockchain
		GetStub().GetState(key) - Read from blockchain
		GetStub().GetTxID() - Get transaction ID
		GetStub().GetQueryResult(query) - CouchDB queries

Uses CouchDB for Rich Queries, doing complex DB queries with the ledger
	- CouchDB uses json based query language
	- Good for advanced filtering
*/

// AuditContract provides functions for managing audit entries
type AuditContract struct {
	contractapi.Contract
}

// InitLedger initializes the ledger with sample audit entries for testing (Optional: only for dev/testing)
func (c *AuditContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	log.Printf("[InitLedger] ENTER")

	// Get deterministic timestamp from transaction (same across all peers)
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	// Sample audit entries for testing
	audits := []AuditEntry{
		{
			ID:            "audit-001",
			TimeStamp:     txTimestamp.AsTime().UnixMilli(),
			UserID:        "user-alice",
			UserRole:      "ADMIN",
			Action:        "CREATE",
			ResourceType:  "CREDENTIAL",
			ResourceID:    "cred-001",
			OldValue:      "",
			NewValue:      `{"type":"DIPLOMA","status":"ACTIVE"}`,
			Status:        "SUCCESS",
			IPAddress:     "192.168.1.100",
			SessionID:     "sess-001",
			Metadata:      `{"source":"web-portal"}`,
			ComplianceTag: "SOC2",
			TxID:          ctx.GetStub().GetTxID(),
		},
		{
			ID:            "audit-002",
			TimeStamp:     txTimestamp.AsTime().UnixMilli(),
			UserID:        "user-bob",
			UserRole:      "AUDITOR",
			Action:        "QUERY",
			ResourceType:  "CREDENTIAL",
			ResourceID:    "cred-001",
			OldValue:      "",
			NewValue:      "",
			Status:        "SUCCESS",
			IPAddress:     "192.168.1.101",
			SessionID:     "sess-002",
			Metadata:      `{"source":"api"}`,
			ComplianceTag: "GDPR",
			TxID:          ctx.GetStub().GetTxID(),
		},
	}

	// Check audits for syntax errors and add to ledger
	for _, audit := range audits {
		auditJSON, err := json.Marshal(audit)
		if err != nil {
			log.Printf("[InitLedger] ERROR marshaling audit ID=%s err=%v", audit.ID, err)
			return fmt.Errorf("failed to marshal audit entry ID=%s: %v", audit.ID, err)
		}
		//  Putstate writes JSON to ledger using audit.ID as key
		err = ctx.GetStub().PutState(audit.ID, auditJSON) 
		if err != nil {
			log.Printf("[InitLedger] ERROR writing audit ID=%s err=%v", audit.ID, err)
			return fmt.Errorf("failed to write audit entry ID=%s to ledger: %v", audit.ID, err)
		}

		log.Printf("[InitLedger] Created audit entry ID=%s", audit.ID)
	}

	log.Printf("[InitLedger] SUCCESS - initialized %d audit entries", len(audits))
	return nil
}


/* 
--- CREATE AUDIT ENTRY --- 
 Create an audti log entry on the ledger, used to record all credential access events
*/
func (c *AuditContract) LogAudit(ctx contractapi.TransactionContextInterface,
	id string, userId string, userRole string, action string,
	resourceType string, resourceId string, oldValue string, newValue string,
	status string, ipAddress string, sessionId string,
	metadata string, complianceTag string) error {

	// Entry log
	log.Printf("[LogAudit] ENTER id=%s userId=%s action=%s resourceId=%s",
		id, userId, action, resourceId)

	// Input validation - Required fields
	if id == "" {
		return fmt.Errorf("id is required")
	}
	if userId == "" {
		return fmt.Errorf("userId is required")
	}
	if action == "" {
		return fmt.Errorf("action is required")
	}

	// Check for Valid actions
	validActions := map[string]bool{
		"CREATE": true, "UPDATE": true, "DELETE": true,
		"QUERY": true, "VERIFY": true, "REVOKE": true, "ISSUE": true,
	}
	if !validActions[action] {
		return fmt.Errorf("invalid action: %s. Valid actions: CREATE, UPDATE, DELETE, QUERY, VERIFY, REVOKE, ISSUE", action)
	}

	// Length validation (prevent DoS, reject overized/sus inputs)
	if len(id) > 64 {
		return fmt.Errorf("id exceeds maximum length of 64 characters")
	}

	// Check if audit entry already exists on ledger
	exists, err := c.AuditExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check if audit entry exists: %v", err)
	}
	if exists {
		return fmt.Errorf("audit entry %s already exists (audit log is append-only)", id)
	}

	// Get Fabric transaction ID for tracing
	txID := ctx.GetStub().GetTxID()
	
	// Get deterministic timestamp from transaction (same across all peers)
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	// Create audit entry with auto-populated fields
	entry := AuditEntry{
		ID:            id,
		TimeStamp:     txTimestamp.AsTime().UnixMilli(),
		UserID:        userId,
		UserRole:      userRole,
		Action:        action,
		ResourceType:  resourceType,
		ResourceID:    resourceId,
		OldValue:      oldValue,
		NewValue:      newValue,
		Status:        status,
		IPAddress:     ipAddress,
		SessionID:     sessionId,
		Metadata:      metadata,
		ComplianceTag: complianceTag,
		TxID:          txID,
	}

	// Json encode entry 
	entryJSON, err := json.Marshal(entry)
	if err != nil {
		log.Printf("[LogAudit] ERROR id=%s err=%v", id, err)
		return fmt.Errorf("failed to marshal audit entry ID=%s: %v", id, err)
	}

	// Write to ledger
	err = ctx.GetStub().PutState(id, entryJSON)
	if err != nil {
		log.Printf("[LogAudit] ERROR id=%s err=%v", id, err)
		return fmt.Errorf("failed to write audit entry ID=%s to ledger: %v", id, err)
	}

	// Success log
	log.Printf("[LogAudit] SUCCESS id=%s txId=%s userId=%s action=%s",
		id, txID, userId, action)
	return nil
}


// HELPER AuditExists : checks if an audit entry exists in the ledger
func (c *AuditContract) AuditExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	log.Printf("[AuditExists] ENTER id=%s", id)

	// Input validation
	if id == "" {
		return false, fmt.Errorf("id is required")
	}

	// Get state of audit from ledger
	auditJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		log.Printf("[AuditExists] ERROR id=%s err=%v", id, err)
		return false, fmt.Errorf("failed to check if audit entry exists: %v", err)
	}

	exists := auditJSON != nil
	log.Printf("[AuditExists] id=%s exists=%v", id, exists)
	return exists, nil
}

/*
--- GET AUDIT by ID--- 
retrieves a specific audit entry by ID
returns: *AuditEntry, a pointr to AuditEntry struct, 
         -  pro for pointer: Doesn't copy entire struct, just returns memory address, can return Nil
*/
func (c *AuditContract) GetAudit(ctx contractapi.TransactionContextInterface, id string) (*AuditEntry, error) {
	log.Printf("[GetAudit] ENTER id=%s", id)

	// Input validation
	if id == "" {
		return nil, fmt.Errorf("id is required")
	}

	// Get state from ledger
	auditJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		log.Printf("[GetAudit] ERROR id=%s err=%v", id, err)
		return nil, fmt.Errorf("failed to read audit entry ID=%s from ledger: %v", id, err)
	}

	// Check if exists
	if auditJSON == nil {
		log.Printf("[GetAudit] NOT_FOUND id=%s", id)
		return nil, fmt.Errorf("audit entry %s does not exist in ledger", id)
	}

	// Unmarshal JSON
	var audit AuditEntry
	err = json.Unmarshal(auditJSON, &audit)
	if err != nil {
		log.Printf("[GetAudit] ERROR id=%s err=%v", id, err)
		return nil, fmt.Errorf("failed to unmarshal audit entry ID=%s: %v", id, err)
	}

	log.Printf("[GetAudit] SUCCESS id=%s userId=%s action=%s", id, audit.UserID, audit.Action)
	return &audit, nil
}

/*
--- GET ALL AUDITS -- 
Returns all audit entries from the ledger
- In PROD, use pagination (GetStateByRangeWithPagination) to handle large datasets
*/
func (c *AuditContract) GetAllAudits(ctx contractapi.TransactionContextInterface) ([]*AuditEntry, error) {
	log.Printf("[GetAllAudits] ENTER")

	// Get all entries from ledger
	// Using "" empty strings for startKey and endKey returns all entries
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "") // Opens connection
	if err != nil {
		log.Printf("[GetAllAudits] ERROR err=%v", err)
		return nil, fmt.Errorf("failed to get all audit entries: %v", err)
	}

	// defer runs when function exits like a finally, .Close() closes connection, prevents memory leaks 
	defer resultsIterator.Close()

	var audits []*AuditEntry

	// Iterate through results and push to audits array 
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			log.Printf("[GetAllAudits] ERROR iterating err=%v", err)
			return nil, fmt.Errorf("failed to iterate results: %v", err)
		}

		var audit AuditEntry
		err = json.Unmarshal(queryResponse.Value, &audit)
		if err != nil {
			log.Printf("[GetAllAudits] ERROR unmarshaling key=%s err=%v", queryResponse.Key, err)
			return nil, fmt.Errorf("failed to unmarshal audit entry: %v", err)
		}

		audits = append(audits, &audit)
	}

	log.Printf("[GetAllAudits] SUCCESS count=%d", len(audits))
	return audits, nil
}



/*
--- GET AUDITS by USER ---
Get all audit entries for a given user
- uses couchDB rich queries 
*/
func (c *AuditContract) QueryAuditsByUser(ctx contractapi.TransactionContextInterface, userId string) ([]*AuditEntry, error) {
	log.Printf("[QueryAuditsByUser] ENTER userId=%s", userId)

	// Input validation
	if userId == "" {
		return nil, fmt.Errorf("userId is required")
	}

	// Build CouchDB query selector
	queryString := fmt.Sprintf(`{
		"selector": {
			"userId": "%s"
		},
		"sort": [{"timestamp": "desc"}]
	}`, userId)

	return c.queryAudits(ctx, queryString)
}

/*
--- GET AUDITS by DATE ---
Returns a list of audits within a time range 
Params: startDate and endDate should be Unix timestamps in milliseconds
*/
func (c *AuditContract) QueryAuditsByDateRange(ctx contractapi.TransactionContextInterface, startDate int64, endDate int64) ([]*AuditEntry, error) {
	log.Printf("[QueryAuditsByDateRange] ENTER startDate=%d endDate=%d", startDate, endDate)

	// Input validation
	if startDate < 0 || endDate < 0 {
		return nil, fmt.Errorf("startDate and endDate must be positive timestamps")
	}
	if startDate > endDate {
		return nil, fmt.Errorf("startDate must be before endDate")
	}

	// Build CouchDB query selector
	queryString := fmt.Sprintf(`{
		"selector": {
			"timestamp": {
				"$gte": %d,
				"$lte": %d
			}
		},
		"sort": [{"timestamp": "desc"}]
	}`, startDate, endDate)

	return c.queryAudits(ctx, queryString)
}


/*
--- GET AUDITS by ACTION TYPE ---
Returns audits filtered by a specific action type 
*/
func (c *AuditContract) QueryAuditsByAction(ctx contractapi.TransactionContextInterface, action string) ([]*AuditEntry, error) {
	log.Printf("[QueryAuditsByAction] ENTER action=%s", action)

	// Input validation
	if action == "" {
		return nil, fmt.Errorf("action is required")
	}

	// Validate action type
	validActions := map[string]bool{
		"CREATE": true, "UPDATE": true, "DELETE": true,
		"QUERY": true, "VERIFY": true, "REVOKE": true, "ISSUE": true,
	}
	if !validActions[action] {
		return nil, fmt.Errorf("invalid action: %s", action)
	}

	// Build CouchDB query selector
	queryString := fmt.Sprintf(`{
		"selector": {
			"action": "%s"
		},
		"sort": [{"timestamp": "desc"}]
	}`, action)

	return c.queryAudits(ctx, queryString)
}


/*
--- HELPER queryAudits ----
executes CouchDB queries to get audits 

*/
func (c *AuditContract) queryAudits(ctx contractapi.TransactionContextInterface, queryString string) ([]*AuditEntry, error) {
	log.Printf("[queryAudits] ENTER queryString=%s", queryString)

	// Execute rich query
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		log.Printf("[queryAudits] ERROR err=%v", err)
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var audits []*AuditEntry

	// Iterate through results
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			log.Printf("[queryAudits] ERROR iterating err=%v", err)
			return nil, fmt.Errorf("failed to iterate query results: %v", err)
		}

		var audit AuditEntry
		err = json.Unmarshal(queryResponse.Value, &audit)
		if err != nil {
			log.Printf("[queryAudits] ERROR unmarshaling key=%s err=%v", queryResponse.Key, err)
			return nil, fmt.Errorf("failed to unmarshal audit entry: %v", err)
		}

		audits = append(audits, &audit)
	}

	log.Printf("[queryAudits] SUCCESS count=%d", len(audits))
	return audits, nil
}






