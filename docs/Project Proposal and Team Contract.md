
## Requirements

Project Proposal [1-2 Pages]

- Problem Statement
- Motivation
- Literature Review (A brief, relevant review is sufficient at this stage)
- Proposed Architecture
- Chosen Platform
- References

Team Contract [1 Page]

- Roles
- Expectations
- Meeting Frequency

 ---
## Doc 

### Problem Statement 
We upload docs (id, passports) for identity verifications or use our credentials on various sites without having any visibility over when, where and who access it, where its stored etc. We also don't have any control over revoking access etc and fully trust companies to manage our identity and Creds.

### Motivation 
Build a decentralized IAM system that gives you control, allowing you to track who accessed/verified your identity when and for what. Also giving user control on accepting and revoking access. Something like this could be used to build a dashboard showing the full IAM lifecycle giving a ton of visibility. This could be used for building access event notifications and detect anomalies.

### Literature Review 


### Proposed Architecture
Hyperledger Fabric 

Why:
- Permissioned audit trial: Only authorized users should see trials, ETH doesnt allow this 
- ETH will have a ton of issues when it comes to privacy, revoking access, deleting trails 

How it works:
- Organizations join a Fabric network (each is a "peer node")
- Smart contracts (chaincode) run in Docker containers on each peer
- When user registers, chaincode writes to the ledger (instant, no gas)
- Verifier accesses credential → chaincode emits an event
- User queries their events via an API that checks permissions server-side
- Events are stored in Private Data Collections (visible only to authorized orgs)

---
## Notes 

*Bitcoin*: censorship-resistant payment with immutability but lacks programability. 
- not relevant to our problem 

*Ethereum*: Programable smart contracts that and transparent audibility
- Anyone can view full event log 
- Issue: Logging things like "User x verified passport" will forever be visible on public ledger 

**HyperLedger Ledger**:  perfect for our problem
- Def: Permissioned identity verification with privacy controls. 
	- We define who sees what
	- encrypt sensitive data 
	- Modular chain code/ Smart contracts in Golang
	- Exactly how enterprises *handle compliance while having audit trai*

### Scope of MVP
keeping it simple for our class's scope can change if needed 

**Target user group**: Students  that need diploma, location and age verifications 

**How will users access logs**: We can start with creating a simple API that users can query and if we have time we can build a simple dashboard ui on top

**Credential types**: Diploma and License 
- Once you build the issuance/verification flow for one type, the second is just a copy with different field names. Same smart contract handles both.

**How do organizations use "auditTrail"**: team provisions the network upfront

**Revoking access**: Simple revoke, without complex deleting history from chain.
- GDPR-friendly

### Privacy model
- *Creds issuer* sees issuance events 
- *Verifier* sees their own verification events 
- *User* (person who the creds belong to): sees 100% of their own access history across all verifiers 
- logs are cryptographically auditable but not visible to random third parties 

### System Design

Hyperledger Fabric > ETH for our usecase 

Hyperledger Fabric is best for our usecase I think cuz: 
- Permissioned audit trial: Only authorized users should see trials, ETH doesnt allow this 
- ETH will have a ton of issues when it comes to privacy, revoking access, deleting trails 
- 
#### Architecture Flow:
```
User/Org                    Fabric Network (Private)
 |                                  |
 |--Register DID---->  [Chaincode (Go)]---> World State (ledger)
 |                                  |
 |--Issue Credential----> [Access Control Check]---> Channel Storage
 |                                  |
 |--Revoke----------->  [Event Emitted]---> Private Data Collection
 |                                  |
 |--Query Audit Log---> [Query ledger with permissions]
 |
Sees only OWN events (ACL enforced)


```

How it works:
- Organizations join a Fabric network (each is a "peer node")
- Smart contracts (chaincode) run in Docker containers on each peer
- When user registers, chaincode writes to the ledger (instant, no gas)
- Verifier accesses credential → chaincode emits an event
- User queries their events via an API that checks permissions server-side
- Events are stored in Private Data Collections (visible only to authorized orgs)


### Things well use 
Fabric's *purging* for deleting historical data from ledger, for when 



****
## Extended notes: 

### System Design:Hyperledger Fabric

#### ETH Architecture 
```

User                  Smart Contracts (on Ethereum mainnet/testnet)
 |                              |
 |--Register DID----------->  [DID Registry Contract]
 |                              |
 |--Issue Credential-------->  [Credential Status Contract]
 |                              |
 |--Revoke Credential-------->  [Revocation Registry]
 |                              |
 |--Query Audit Log-------->  Blockchain Events (public logs)
 |
 +-> Read all events from chain (everyone can see, but filter by user)
```

How it works:
- User/issuer calls `registerDID()` → stores on-chain
- Issuer calls `issueCredential()` → logs to blockchain, costs gas
- User calls `revokeCredential()` → marks revoked, costs gas
- Verifier calls `verifyCredential()` → checks status, reads blockchain
- Everyone can query events, but UI filters to show only "your" access history

Pros:
- Simple to build (one smart contract, maybe 200-300 lines Solidity)
- Transparent (auditable by anyone technically)
- Works on public testnets (Sepolia) = free testing

Cons:
- **Data Privacy Issue**: All events are public on-chain. Even though you filter in the UI, someone could query the contract and see "User123 had credential verified." This violates your privacy requirement slightly (not a blocker, but a leak).
- Gas costs per operation (issuance, revocation, verification)
- Scalability: Each operation is a transaction; at scale (thousands of users), this gets expensive and slow
- **Can't truly delete data** (GDPR issue for production)



#### HYPERLEDGER FABRIC APPROACH

**Architecture Flow:**
```
User/Org                    Fabric Network (Private)
 |                                  |
 |--Register DID---->  [Chaincode (Go)]---> World State (ledger)
 |                                  |
 |--Issue Credential----> [Access Control Check]---> Channel Storage
 |                                  |
 |--Revoke----------->  [Event Emitted]---> Private Data Collection
 |                                  |
 |--Query Audit Log---> [Query ledger with permissions]
 |
Sees only OWN events (ACL enforced)


```

How it works:
- Organizations join a Fabric network (each is a "peer node")
- Smart contracts (chaincode) run in Docker containers on each peer
- When user registers, chaincode writes to the ledger (instant, no gas)
- Verifier accesses credential → chaincode emits an event
- User queries their events via an API that checks permissions server-side
- Events are stored in Private Data Collections (visible only to authorized orgs)

Pros:
- **Privacy built-in**: Access control is enforced at the ledger level. Non-members literally cannot see data.
- **No gas costs**: Transactions are instant, no fees
- **Scalable**: Fabric handles thousands of users more gracefully
- **True data deletion**: You can purge historical data if needed (GDPR ready)
- **Organizational control**: Each org controls its own data

Cons:
- More complex to set up (need Docker, multiple peers, channels, orderers)
- Requires more operational infrastructure (but your team can handle this given your backend skills)
- Smaller learning curve for your first project (but you'll learn enterprise-grade concepts)



---

---

---
## Questions 
1. *Privacy:* Who should be able to see the logs of who accessed what? everyone on the block chain or only authorized users? 
---

## Look further into 
 - GDPR/Compliance and how it applies to us 
 - simple UI 





---
**

Project Proposal and Team Contract

  
  
  

Problem Statement

We upload documents (IDs, passports) for identity verification or use our credentials on various sites without having any visibility over when, where, or who accesses them, where they are stored, etc. We also don't have any control over revoking access, etc, and fully trust companies to manage our identity and credentials.

  

Motivation

Transparency, Control, Accountability

  

“AuditTrail” keeps an immutable, timestamped record of all the events related to your credentials being accessed or verified. Each access event is cryptographically recorded on the blockchain. Also giving user control on accepting and revoking access.  It gives you control, allowing you to track who accessed/verified your identity when and for what. Also giving user control on accepting and revoking access. Users can query their audit trails via an API, allowing for maximum visibility, control and anomaly detection. 

  

Something like this could be used to build a dashboard showing the full IAM lifecycle and building access event notifications and detecting anomalies.  

  

[ keeping it simple for our class's scope can change if needed, add or remove as needed ] 

  

Target user group: Students who need a diploma, location, and age verifications 

  

How will users access logs: We can start with creating a simple API that users can query and if we have time we can build a simple dashboard ui on top

  

Credential types: Diploma and License 

- Once you build the issuance/verification flow for one type, the second is just a copy with different field names. Same smart contract handles both.

  

How do organizations use "auditTrail": team provisions the network upfront

  

Revoking access: Simple revocation, without complex deletion of history from the chain.

- GDPR-friendly

  

  

Literature Review (A brief, relevant review is sufficient at this stage): 

  

Proposed Architecture

  

Blockchain Layer: Hyperledger Fabric 

- A Permissioned Hyperledger Fabric network where authorized users/orgs nodes like universities, employers, students, etc, maintain a shared ledger.
    
- Reasoning: 
    

- Permissioned audit trail: Only authorized users should see trials; ETH does not allow this 
    
-  ETH will have a ton of issues when it comes to privacy, revoking access, and deleting trails 
    

  

Smart Contract Layer: Hyperledger Fabric Chaincode in Golang for business logic. 

- Core functions:
    

- IssueCreds()
    
- VerifyCreds()
    
- RevokeCreds()
    
- QueryAuditTrail()
    

  

API Layer: [Node.js](http://node.js) or Python API for a REST api to interact with the blockchain

- Used for querying access trails 
    

  

Chosen Platform

Hyperledger Fabric is best for our use case and not ETH 

- Permissioned audit trial: Only authorized users should see trials, ETH doesnt allow this 
    
- Can avoid ETH Gas costs 
    
- ETH will have a ton of issues when it comes to privacy, revoking access, deleting trails
    

  

References:

Ethereum White Paper:  [https://ethereum.org/en/whitepaper](https://ethereum.org/en/whitepaper)

  

Hyperledger Fabric White Paper: https://arxiv.org/pdf/1801.10228.pdf 

  

Hyperledger-fabric Documentation: https://hyperledger-fabric.readthedocs.io/en/release-2.5/

  

Decentralized Identifiers (DID) docs: [https://www.w3.org/TR/did-1.0/](https://www.w3.org/TR/did-1.0/)

  

  

  

  

  

  
  
  
  
**