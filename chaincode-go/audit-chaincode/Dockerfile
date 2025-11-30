# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0

FROM golang:alpine AS builder

WORKDIR /app
COPY . .

# Download dependencies
RUN go mod download

# Build the chaincode
RUN CGO_ENABLED=0 go build -o audit-trail-chaincode .

FROM alpine:latest

# Copy the compiled binary from builder
COPY --from=builder /app/audit-trail-chaincode /usr/local/bin/audit-trail-chaincode

# Set execute permissions
RUN chmod +x /usr/local/bin/audit-trail-chaincode

EXPOSE 9999

CMD ["audit-trail-chaincode"]
