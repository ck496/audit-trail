import { useState } from 'react';
import { getAllAudits, queryAuditsByUser, queryAuditsByAction, queryAuditsByDateRange } from '../services/api';
import './AuditLogs.css';

const AuditLogs = () => {
    const [queryType, setQueryType] = useState('all'),
        [userId, setUserId] = useState(''),
        [action, setAction] = useState('CREATE'),
        [startDate, setStartDate] = useState(''),
        [endDate, setEndDate] = useState(''),
        [audits, setAudits] = useState(null),
        [loading, setLoading] = useState(false),
        [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setAudits(null);

        try {
            let data;
            if (queryType === 'all') {
                data = await getAllAudits();
            } else if (queryType === 'user') {
                data = await queryAuditsByUser(userId);
            } else if (queryType === 'action') {
                data = await queryAuditsByAction(action);
            } else if (queryType === 'daterange') {
                const start = new Date(startDate).getTime();
                const end = new Date(endDate).getTime();
                data = await queryAuditsByDateRange(start, end);
            }
            const sorted_audits = data.sort((a, b) => b.timestamp - a.timestamp);
            setAudits(sorted_audits);
        }
        catch (error) { setError(error.message); }
        finally { setLoading(false); }
    };


    const summaryData = () => {
        if (!audits || audits.length === 0) return null;

        const total = audits.length;
        let createCount = 0,
            queryCount = 0,
            updateCount = 0,
            deleteCount = 0,
            successCount = 0;

        for (let i = 0; i < audits.length; i++) {
            const audit = audits[i];
            if (audit.action === 'CREATE') createCount++;
            else if (audit.action === 'QUERY') queryCount++;
            else if (audit.action === 'UPDATE') updateCount++;
            else if (audit.action === 'DELETE') deleteCount++;
            if (audit.status === 'SUCCESS') successCount++;
        }

        const successRate = Math.round((successCount / total) * 100);

        return {
            total: total,
            createCount: createCount,
            queryCount: queryCount,
            updateCount: updateCount,
            deleteCount: deleteCount,
            successRate: successRate,
        };
    };


    const summary = summaryData();

    return (
        <div className="cred_section">
            <h2>Audit Logs</h2>
            <div className="card search-card">
                <form onSubmit={handleSubmit} className="input_form">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Query Type</label>
                        <select value={queryType} onChange={(e) => setQueryType(e.target.value)}>
                            <option value="all">Get All Audits</option>
                            <option value="user">By User ID</option>
                            <option value="action">By Action</option>
                            <option value="daterange">By Date Range</option>
                        </select>
                    </div>

                    {queryType === 'all' && (
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>User ID</label>
                            <input type="text" value="" disabled placeholder="User ID"
                                   style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#999' }} />
                        </div>
                    )}

                    {queryType === 'user' && (
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>User ID</label>
                            <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} required placeholder="user-alice" />
                        </div>
                    )}

                    {queryType === 'action' && (
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Action</label>
                            <select value={action} onChange={(e) => setAction(e.target.value)}>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="QUERY">QUERY</option>
                                <option value="VERIFY">VERIFY</option>
                                <option value="REVOKE">REVOKE</option>
                                <option value="ISSUE">ISSUE</option>
                            </select>
                        </div>
                    )}

                    {queryType === 'daterange' && (
                        <>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Start Date</label>
                                <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>End Date</label>
                                <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                            </div>
                        </>
                    )}

                    <div className="form-actions no-margin" style={{ flex: '0 0 auto' }}>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Fetching...' : 'Fetch Audit Logs'}
                        </button>
                    </div>
                </form>
            </div>

            {error && <div className="alert error">{error}</div>}

            {audits && (
                <>
                    {summary && (
                        <div className="summary-grid">
                            <div className="summary-card">
                                <span className="summary-label">Total Entries</span>
                                <span className="summary-value">{summary.total}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Success Rate</span>
                                <span className="summary-value">{summary.successRate}%</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Created</span>
                                <span className="summary-value">{summary.createCount}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Queried</span>
                                <span className="summary-value">{summary.queryCount}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Updated</span>
                                <span className="summary-value">{summary.updateCount}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Deleted</span>
                                <span className="summary-value">{summary.deleteCount}</span>
                            </div>
                        </div>
                    )}

                    {audits.length === 0 ? (
                        <div className="alert error">No audit entries found.</div>
                    ) : (
                        <div className="card table-card">
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Action</th>
                                            <th>User ID</th>
                                            <th>Role</th>
                                            <th>Resource</th>
                                            <th>Status</th>
                                            <th>Compliance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {audits.map((audit) => (
                                            <tr key={audit.id}>
                                                <td>{new Date(audit.timestamp).toLocaleString()}</td>
                                                <td>
                                                    <span className={`action_details ${audit.action.toLowerCase()}`}>
                                                        {audit.action}
                                                    </span>
                                                </td>
                                                <td>{audit.userId}</td>
                                                <td>{audit.userRole}</td>
                                                <td>{audit.resourceType}: {audit.resourceId}</td>
                                                <td>
                                                    <span className={`outcome ${audit.status.toLowerCase()}`}>
                                                        {audit.status}
                                                    </span>
                                                </td>
                                                <td className="reason_box">{audit.complianceTag || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLogs;
