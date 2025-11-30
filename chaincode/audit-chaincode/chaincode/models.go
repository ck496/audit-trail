package chaincode

// models.go defines the signatures of various objects in Audit-trail

// an AuditEntry object: a single audit log entry
type AuditEntry struct {
	ID 			  string	`json:"id"`				//UUID 
	TimeStamp     int64		 `json:"timestamp"`     // Unix timestamp (milliseconds)
	UserID        string    `json:"userId"`        // Who performed the action
	UserRole      string    `json:"userRole"`      // User's role at time of action
	Action        string    `json:"action"`        // Action type (QUERY, CREATE, UPDATE, DELETE, etc.)
	ResourceType  string    `json:"resourceType"`  // Type of resource affected
	ResourceID    string    `json:"resourceId"`    // Specific resource identifier
	OldValue      string    `json:"oldValue"`      // Previous state (JSON string)
	NewValue      string    `json:"newValue"`      // New state (JSON string)
	Status        string    `json:"status"`        // SUCCESS or FAILURE
	IPAddress     string    `json:"ipAddress"`     // Client IP address
	SessionID     string    `json:"sessionId"`     // Session identifier
	Metadata      string    `json:"metadata"`      // Additional context (JSON)
	ComplianceTag string    `json:"complianceTag"` // HIPAA, GDPR, SOC2, etc.
	TxID          string    `json:"txId"`          // Fabric transaction ID

}

// User Object: a system user with permissions
type User struct {
	ID           string   `json:"id"`           // UUID
	Username     string   `json:"username"`     // Username for login
	Email        string   `json:"email"`        // Email address
	Role         string   `json:"role"`         // ADMIN, AUDITOR, USER
	Organization string   `json:"organization"` // Which org they belong to
	Permissions  []string `json:"permissions"`  // Granular permissions
	Active       bool     `json:"active"`       // Account status
	CreatedAt    int64    `json:"createdAt"`    // Creation timestamp
	UpdatedAt    int64    `json:"updatedAt"`    // Last update timestamp
	CreatedBy    string   `json:"createdBy"`    // Who created this user
}

// ComplianceReport object:  a compliance audit report details 
type ComplianceReport struct {
	ID             string `json:"id"`             // Report ID
	ReportType     string `json:"reportType"`     // HIPAA, SOC2, GDPR
	StartDate      int64  `json:"startDate"`      // Report period start
	EndDate        int64  `json:"endDate"`        // Report period end
	GeneratedBy    string `json:"generatedBy"`    // User who generated
	GeneratedAt    int64  `json:"generatedAt"`    // Generation timestamp
	TotalEntries   int    `json:"totalEntries"`   // Total audit entries
	AnomaliesFound int    `json:"anomaliesFound"` // Number of anomalies
	Status         string `json:"status"`         // PENDING, COMPLETED
	Summary        string `json:"summary"`        // Report summary (JSON)
	Findings       string `json:"findings"`       // Detailed findings (JSON)
}

// AuditStats object: statistics about audit logs
type AuditStats struct {
	TotalEntries      int            `json:"totalEntries"`
	EntriesByAction   map[string]int `json:"entriesByAction"`
	EntriesByUser     map[string]int `json:"entriesByUser"`
	EntriesByResource map[string]int `json:"entriesByResource"`
	SuccessRate       float64        `json:"successRate"`
	StartDate         int64          `json:"startDate"`
	EndDate           int64          `json:"endDate"`
}

// QueryResult structure used for handling result of query
type QueryResult struct {
	Key    string `json:"key"`
	Record *AuditEntry
}