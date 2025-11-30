# AuditTrail

AuditTrail is a decentralized IAM system built with Hyperledger Fabric that:

- Immutably logs all system activities
- Supports multi-organization access control
- Detects anomalies and suspicious activities
- Offers real-time audit streaming
- Enables tamper-proof record keeping

_AuditTrail gives you complete visibility and control over your credentials_

## Part 1: Blockchain

### Architecture

### The Network

### Chain code

### Deployment

We use **Chaincode-as-a-Service (CCAAS)** instead of the traditional Docker-in-Docker based deployment method for model for building and deploying chain code as it is industry best practice and better for production ready.

Traditional
Peer → Receives source code → Builds internally → FAILS

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

Benefits:

- Smaller image: ~20MB vs ~800MB
- Faster deployment: Less data to transfer
- More secure

## Part 2: REST API

## Part 3: UI

## Consumption Guide
