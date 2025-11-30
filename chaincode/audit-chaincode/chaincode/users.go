package chaincode

// import hyperledger fabric SDK for writing go chaincode, provides interfaces:
//  - contractapi.Contract : base struct for contracts
//	- contractapi.TransactionContextInterface : alows you to read/write ledger state

import (
	// import hyperledger fabric SDK for writing go chaincode, provides interfaces:
	//  - contractapi.Contract : base struct for contracts
	//	- contractapi.TransactionContextInterface : alows you to read/write ledger state
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

/*
 ----- MODULE NOTES: -----
 users.go holds all the code related to User Management on the ledger with the folowing functions:
 	- RegisterUser - Create new user with role-based permissions
	- GetUser - Retrieve user by ID
	- UpdateUserRole - Change role and update permissions
	- DeactivateUser - Set active=false (soft delete)
	- UserExists - Check user existence
	- getDefaultPermissions (helper) - Map role to permission array

Roles:
	Roles with default permissions:
	- ADMIN: audit.read, audit.write, user.manage, report.generate
	- AUDITOR: audit.read, report.generate
	- USER: audit.read.own


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


Composite key:
	Without composite keys:
	"user-alice" → User data
	"audit-001"  → Audit data
	Problem: Mixed in same namespace

	With composite keys:
	"USER~user-alice~"  → User data
	"AUDIT~audit-001~"  → Audit data
	Benefit: Can query "all users" separately from "all audits"

	Usage:
		Write
		compositeKey := CreateCompositeKey("USER", []string{"user-alice"})
		PutState(compositeKey, data)  // Stores as "USER~user-alice~"

		Read
		compositeKey := CreateCompositeKey("USER", []string{"user-alice"})
		GetState(compositeKey)  // Retrieves "USER~user-alice~"

		Query all users
		iterator := GetStateByPartialCompositeKey("USER", []string{})
		// Returns all keys starting with "USER~"
*/

// AuditContract provides functions for managing audit entries
type AuditContract struct {
	contractapi.Contract
}

/*
--- REGISTER USER  ---
Add new users to ledger 
- get permissions for user role
- create new user object
- build compositekey
- add user to ledger 
*/
func (c *AuditContract) RegisterUser(ctx contractapi.TransactionContext, id string, name string, email string, role string, organization string, createdBy string ) error {
	log.Printf("[RegisterUser] ENTER id=%s role=%s org=%s", id, role, organization)

	//Input validation (id, name, email, role required)
	if id == "" {
		return fmt.Errorf("id is required")
	}
	if name == "" {
		return fmt.Errorf("name is required")
	}
	if email == ""{
		return fmt.Errorf("email is required")
	}
	if role == ""{
		return fmt.Errorf("role is required")
	}

	// TODO: Step 2 - Validate role is ADMIN, AUDITOR, or USER
	validRoles := map[string]bool{
		"ADMIN": true, "AUDITOR": true, "USER": true,
	}
	if !validRoles[role] {
		return fmt.Errorf("invalid validRoles: %s. Valid Roles: ADMIN, AUDITOR, or USER", role)
	}

	// Check ID length limits
	if len(id) > 64 {
		return fmt.Errorf("id exceeds maximum length of 64 characters")
	}
	
	// Check if user exists 
	exists, err := c.userExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check if user exists: %v", err)
	}
	if exists {
		return fmt.Errorf("user %s already exists", id)
	}

	//Get default permissions for role
	permissions := getDefaultPermissions(role)

	// Create User struct with all fields
	user := User{
		ID:           id,
		Username:         name,
		Email:        email,
		Role:         role,
		Permissions:  permissions,
		Organization: organization,
		Active:       true,
		CreatedBy:    createdBy,
		CreatedAt:    time.Now().UnixMilli(),
	}

	// Create composite key: namespaces users separately from audits 
	comopositeKey, err := ctx.GetStub().CreateCompositeKey("USER", []string{id})
	if err != nil{
		log.Printf("[RegisterUser] ERROR creating composite key id=%s err=%v", id, err)
		return fmt.Errorf("failed to create composite key for user ID=%s: %v", id, err)
	}
	// Marshal to JSON
	userJSON, err := json.Marshal(user)
	if err != nil {
		log.Printf("[RegisterUser] ERROR marshaling user id=%s err=%v", id, err)
		return fmt.Errorf("failed to marshal user ID=%s: %v", id, err)
	}

	// Write user to  ledger
	err = ctx.GetStub().PutState(comopositeKey, userJSON)
	if err != nil {
		log.Printf("[RegisterUser] ERROR writing user id=%s err=%v", id, err)
		return fmt.Errorf("failed to write user ID=%s to ledger: %v", id, err)
	}



	// Log success
	log.Printf("[RegisterUser] SUCCESS id=%s role=%s org=%s", id, role, organization)
	return nil




}



/*
--- GET USER by ID ---
TODO:
*/


/*
--- UPDATE USER ROLE ---

TODO:
*/

/*
--- DEACTIVATE USER ROLE ---

TODO:
*/

/*
--- UPDATE USER ROLE ---

TODO:
*/

/*
--- CHECK  USER EXISTS ---
Check if the user is in the ledger 
TODO:
*/
func (c *AuditContract) userExists(ctx contractapi.TransactionContext, id string) (bool, error){
	log.Printf("[UserExists] ENTER id=%s ", id)

	// Input validation
	if id == "" {
		return false, fmt.Errorf("id is required")
	}

	// Create composite key (same pattern as RegisterUser)
	compositeKey, err := ctx.GetStub().CreateCompositeKey("USER", []string{id})
	if err != nil {
		log.Printf("[UserExists] ERROR creating composite key id=%s err=%v", id, err)
		return false, fmt.Errorf("failed to create composite key: %v", err)
	}

	// Get state from ledger
	userJSON, err := ctx.GetStub().GetState(compositeKey)
	if err != nil {
		log.Printf("[UserExists] ERROR id=%s err=%v", id, err)
		return false, fmt.Errorf("failed to check if user exists: %v", err)
	}

	exists := userJSON != nil
	log.Printf("[UserExists] id=%s exists=%v", id, exists)
	return exists, nil

}

/*
--- getDefaultPermissions  ---
Gives default permissions accodining to user roles 
*/

func getDefaultPermissions(role string) []string {
	switch role {
	case "ADMIN":
		return []string{"audit.read", "audit.write", "user.manage", "report.generate"}
	case "AUDITOR":
		return []string{"audit.read", "report.generate"}
	case "USER":
		return []string{"audit.read.own"}
	default:
		return []string{}
	}
}




