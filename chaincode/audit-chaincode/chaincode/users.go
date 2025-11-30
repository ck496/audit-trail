package chaincode

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
type UserContract struct {
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
func (c *UserContract) RegisterUser(ctx contractapi.TransactionContext, id string, name string, email string, role string, organization string, createdBy string ) error {
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

	// Validate role is ADMIN, AUDITOR, or USER
	validRoles := map[string]bool{
		"ADMIN": true, "AUDITOR": true, "USER": true,
	}
	if !validRoles[role] {
		return fmt.Errorf("invalid role: %s. Valid Roles: ADMIN, AUDITOR, or USER", role)
	}

	// Check ID length limits
	if len(id) > 64 {
		return fmt.Errorf("id exceeds maximum length of 64 characters")
	}
	
	// Check if user exists 
	exists, err := c.UserExists(ctx, id)
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
Get a specific user by their ID
Return: full User object with all fields
*/

func (c *UserContract) GetUser(ctx contractapi.TransactionContextInterface, id string) (*User, error) {
	
	log.Printf("[GetUser] ENTER id=%s", id)
	
	//Input validation for ID
	if id == "" {
		return nil, fmt.Errorf("id is required")
	}

	//Create composite key to match how user was stored
	compositeKey, err := ctx.GetStub().CreateCompositeKey("USER", []string{id})
	if err != nil{
		log.Printf("[GetUser] ERROR creating composite key id=%s err=%v", id, err)
		return nil, fmt.Errorf("failed to create composite key for user ID=%s: %v", id, err)
	}
	
	//Get state from ledger using composite key
	userJson, err := ctx.GetStub().GetState(compositeKey)
	if err != nil{
		log.Printf("[GetUser] ERRORfailed to read user from ledger id=%s err=%v", id, err)
		return nil, fmt.Errorf("failed to read user from ledger, user ID=%s: %v", id, err)
	}
	
	//Check if user exists
	if userJson == nil {
		log.Printf("[GetUser] NOT_FOUND id=%s", id)
		return nil, fmt.Errorf("User  ID=%s does not exist in ledger", id)
	}

	
	//Unmarshal JSON to User struct
	var user User
	err = json.Unmarshal(userJson, &user)
	if err !=nil {
		log.Printf("[GetUser] ERROR id=%s err=%v", id, err)
		return nil, fmt.Errorf("failed to unmarshal user from ledger ID=%s: %v", id, err)
	
	}

	//  Log success with key user info
	log.Printf("[GetUser] SUCCESS id=%s role=%s active=%v", id, user.Role, user.Active)
	
	//Return pointer to user and nil error
	 return &user, nil
}


/*
--- UPDATE USER ROLE ---
Changes a user's role and updates their permissions based on new role
- Only for active users
*/
func (c *UserContract) UpdateUserRole(ctx contractapi.TransactionContextInterface, 
	id string, newRole string) error {
	
	log.Printf("[UpdateUserRole] ENTER id=%s newRole=%s", id, newRole)
	
	//Input validation 
	if id == "" {
		return fmt.Errorf("id is required")
	}
	if newRole == "" {
		return fmt.Errorf("newRole is required")
	}

	
	//Validate newRole is valid (ADMIN, AUDITOR, USER)
	validRoles := map[string]bool{
		"ADMIN": true, "AUDITOR": true, "USER": true,
	}
	if !validRoles[newRole] {
		log.Printf("[UpdateUserRole] ERROR, invalid role=%s", newRole)
		return fmt.Errorf("invalid new role: %s. Valid Roles: ADMIN, AUDITOR, or USER", newRole)
	}
	
	//Get current user from ledger
	user, err := c.GetUser(ctx, id)
	if err != nil{
		log.Printf("[UpdateUserRole] ERROR id=%s err=%v", id, err)
		return fmt.Errorf("failed to get user from ledger, user ID=%s: %v", id, err)

	}

	//Validate user is active (business rule)
	//   - If !user.Active → error "cannot update role for inactive user {id}"
	if !user.Active {
		log.Printf("[UpdateUserRole] USER_NOT_ACTIVE id=%s ", id)
		return fmt.Errorf("cannot update role for inactive user id:%s", id)
	}

	
	//Check if role actually changed (optional optimization)
	if user.Role == newRole{
		// user already has role {newRole}
		log.Printf("[UpdateUserRole] ROLE_EXISTS id=%v, currentRole=%v, newRole=%v", id, user.Role, newRole)
		return fmt.Errorf("user id=%s already has role:%s", id, newRole)
	}
	
	// Update to NEW role and permissions, save old role for logs later 
	var oldRole = user.Role
	user.Role = newRole
	user.Permissions = getDefaultPermissions(newRole)
	
	//Create composite key (same as RegisterUser/GetUser)
	comopositeKey, err := ctx.GetStub().CreateCompositeKey("USER", []string{id})
	if err != nil{
		log.Printf("[UpdateUserRole] ERROR creating composite key id=%s err=%v", id, err)
		return fmt.Errorf("failed to create composite key for user ID=%s: %v", id, err)
	}

	// Marshal to JSON
	userJSON, err := json.Marshal(user)
	if err != nil {
		log.Printf("[UpdateUserRole] ERROR marshaling user id=%s err=%v", id, err)
		return fmt.Errorf("failed to marshal user ID=%s: %v", id, err)
	}
	
	// Write updated user back to ledger
	err = ctx.GetStub().PutState(comopositeKey, userJSON)
	if err != nil {
		log.Printf("[UpdateUserRole] ERROR writing user to ledger id=%s err=%v", id, err)
		return fmt.Errorf("failed to write user to ledger, ID=%s to ledger: %v", id, err)
	}

	
	//Log success with old and new role
	log.Printf("[UpdateUserRole] SUCCESS id=%s oldRole=%s newRole=%s", 
	             id, oldRole, newRole)


	//Return nil err for success
	return  nil
}

/*
--- DEACTIVATE USER ROLE ---
Do a soft delete by setting user.Active = false 
*/

func (c *UserContract) DeactivateUser( ctx contractapi.TransactionContextInterface, id string) error {
	log.Printf("[DeactivateUser] ENTER id=%s ", id)

	//Input validation for ID
	if id == "" {
		return  fmt.Errorf("id is required")
	}

	// Get user 
	user, err := c.GetUser(ctx, id)
	if err != nil{
		log.Printf("[DeactivateUser] ERROR id=%s err=%v", id, err)
		return fmt.Errorf("failed to get user from ledger, user ID=%s: %v", id, err)

	}

	// If user is not active return error 
	if !user.Active{
		log.Printf("[DeactivateUser] ERROR user already Deactivate id=%s", id)
		return fmt.Errorf("user already Deactivate, user ID=%s, Active status=%s", id, user.Active)
	}

	// deactivate user, user.Active = false  
	user.Active = false  

	//Create composite key (same as RegisterUser/GetUser)
	comopositeKey, err := ctx.GetStub().CreateCompositeKey("USER", []string{id})
	if err != nil{
		log.Printf("[DeactivateUser] ERROR creating composite key id=%s err=%v", id, err)
		return fmt.Errorf("failed to create composite key for user ID=%s: %v", id, err)
	}

	// Marshal to JSON
	userJSON, err := json.Marshal(user)
	if err != nil {
		log.Printf("[DeactivateUser] ERROR marshaling user id=%s err=%v", id, err)
		return fmt.Errorf("failed to marshal user ID=%s: %v", id, err)
	}
	
	// Write updated user back to ledger
	err = ctx.GetStub().PutState(comopositeKey, userJSON)
	if err != nil {
		log.Printf("[DeactivateUser] ERROR writing user to ledger id=%s err=%v", id, err)
		return fmt.Errorf("failed to write user to ledger, ID=%s to ledger: %v", id, err)
	}


	//Log success with old and new role
	log.Printf("[DeactivateUser] SUCCESS id=%s Active status=%s", id, user.Active)

	//Return nill for error
	return nil

}
 

/*
--- CHECK  USER EXISTS ---
Check if the user is in the ledger 
*/
func (c *UserContract) UserExists(ctx contractapi.TransactionContext, id string) (bool, error){
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




