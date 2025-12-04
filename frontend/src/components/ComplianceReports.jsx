import React, { useState } from 'react';
import { generateComplianceReport, getAllReports } from '../services/api';
import './ComplianceReports.css';

const ComplianceReports = () => {
    const [formData, setFormData] = useState({
        reportType: 'SOC2',
        startDate: '',
        endDate: '',
    }),
        [loading, setLoading] = useState(false),
        [error, setError] = useState(null),
        [result, setResult] = useState(null),
        [reports, setReports] = useState([]);

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const reportData = {
                reportType: formData.reportType,
                startDate: new Date(formData.startDate).getTime(),
                endDate: new Date(formData.endDate).getTime(),
            };
            const data = await generateComplianceReport(reportData);
            setResult(data);
            setReports([data, ...reports]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cred_section">
            <h2>Compliance Reports</h2>
            <div className="card">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Report Type</label>
                        <select name="reportType" value={formData.reportType} onChange={handleChange}>
                            <option value="SOC2">SOC 2</option>
                            <option value="HIPAA">HIPAA</option>
                            <option value="GDPR">GDPR</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                    </div>
                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </form>
            </div>

            {error && <div className="alert error">{error}</div>}

            {result && (
                <div className={`result-card ${result.status === 'COMPLETED' ? 'valid' : 'invalid'}`}>
                    <div className="result-header">
                        <h3>Report Generated</h3>
                        <span className={`status-icon ${result.status === 'COMPLETED' ? 'active' : 'revoked'}`}>
                            {result.status}
                        </span>
                    </div>
                    <div className="result-details">
                        <div className="details">
                            <span className="label">Report ID:</span>
                            <span className="value">{result.id}</span>
                        </div>
                        <div className="details">
                            <span className="label">Type:</span>
                            <span className="value">{result.reportType}</span>
                        </div>
                        <div className="details">
                            <span className="label">Total Entries:</span>
                            <span className="value">{result.totalEntries}</span>
                        </div>
                        <div className="details">
                            <span className="label">Anomalies Found:</span>
                            <span className={`value ${result.anomaliesFound > 0 ? 'errortext' : 'successtext'}`}>
                                {result.anomaliesFound}
                            </span>
                        </div>
                        <div className="details">
                            <span className="label">Generated At:</span>
                            <span className="value">{new Date(result.generatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {reports.length > 0 && (
                <div className="recent-credentials">
                    <h3>Recent Reports</h3>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Report ID</th>
                                    <th>Type</th>
                                    <th>Period</th>
                                    <th>Entries</th>
                                    <th>Anomalies</th>
                                    <th>Status</th>
                                    <th>Generated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr key={report.id}>
                                        <td>{report.id}</td>
                                        <td>{report.reportType}</td>
                                        <td>
                                            {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                                        </td>
                                        <td>{report.totalEntries}</td>
                                        <td>{report.anomaliesFound}</td>
                                        <td>
                                            <span className={`badge ${report.status === 'COMPLETED' ? 'active' : 'revoked'}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td>{new Date(report.generatedAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplianceReports;
