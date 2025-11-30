# ---- STAGE 1: Builder ----
# Use official Go image for building
FROM golang:1.25.4-alpine AS builder

# Install git, needed for go mod download
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first (Docker layer caching optimization)
# - If `go.mod` unchanged, Docker reuses cached layer
# - Speeds up rebuilds when only code changes
COPY go.mod go.sum ./

# Download dependencies (cached if go.mod/go.sum unchanged)
RUN go mod download

# Copy rest of source code: main.go, chaincode/ )
COPY . .

# Build the chaincode binary
# CGO_ENABLED=0: Static linking (no external C dependencies)
# GOOS=linux: Target Linux (even though building on macOS)
# -a: Force rebuild of all packages
# -installsuffix cgo: Suffix for install directory
# -ldflags="-w -s": Strip debug info (smaller binary)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o audit-trail-chaincode .

# OUTPUT: Single binary file `audit-trail-chaincode` with everything compiled in



# ----- STAGE 2: Runtime -----
# Use minimal Alpine Linux image, just enough to run the binary
FROM alpine:latest

# Add ca-certificates for HTTPS connections
RUN apk --no-cache add ca-certificates

# Set working directory
WORKDIR /root/

# Copy ONLY the compiled binary from builder stage
COPY --from=builder /app/audit-trail-chaincode .

# Expose chaincode server port (CCAAS uses 9999)
EXPOSE 9999

# Run the chaincode when container starts
CMD ["./audit-trail-chaincode"]