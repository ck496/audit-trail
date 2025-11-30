package main

import (
	"log"

	"audit-trail/chaincode-go/audit-chaincode/chaincode"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

/*
---- MODULE NOTES ----

main.go serves as the main entry point doing the following:
	1. Creates a new chaincode instance
	2. Registers your contracts (AuditContract + UserContract)
	3. Starts the chaincode server
	4. Listens for transactions from peers

 auditChaincode.Start():
		1. Opens gRPC server on port 9999
		2. Waits for peer connections
		3. Handles transaction requests
		4. Runs until stopped
		Flow: Peer -> gRPC call -> main.go (Start) -> Routes to AuditContract/UserContract -> Returns result


Go rules fo executable programs:
	- Must be package main
	- Must have func main()
	- Go builds it into an executable binary
*/

func main() {
	// Create new chaincode with both contracts
	auditChaincode, err := contractapi.NewChaincode(
		&chaincode.AuditContract{},
		&chaincode.UserContract{},
	)
	if err != nil {
		log.Panicf("Error creating audit trail chaincode: %v", err)
	}

	// Start chaincode server
	// This listens for transactions from Fabric peers
	if err := auditChaincode.Start(); err != nil {
		log.Panicf("Error starting audit trail chaincode: %v", err)
	}
}