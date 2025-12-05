const API_BASE_URL = 'http://localhost:3000';

export const registerUser = async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
        res = await handle_response(response);
    return res.user;
};

export const getUser = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`),
        res = await handle_response(response);
    return res.user;
};

export const updateUserRole = async (userId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
        res = await handle_response(response);
    return res.user;
};

export const logAudit = async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
        res = await handle_response(response);
    return res.audit;
};

export const getAudit = async (auditId) => {
    const response = await fetch(`${API_BASE_URL}/api/audit/${auditId}`),
        res = await handle_response(response);
    return res.audit;
};

export const getAllAudits = async () => {
    const response = await fetch(`${API_BASE_URL}/api/audit`);
    const res = await handle_response(response);
    return res.audits;
};

export const queryAuditsByUser = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/api/audit/user/${encodeURIComponent(userId)}`);
    const res = await handle_response(response);
    return res.audits;
};

export const queryAuditsByDateRange = async (startDate, endDate) => {
    const response = await fetch(
        `${API_BASE_URL}/api/audit/daterange?start=${startDate}&end=${endDate}`
    );
    const res = await handle_response(response);
    return res.audits;
};

export const queryAuditsByAction = async (action) => {
    const response = await fetch(`${API_BASE_URL}/api/audit/action/${encodeURIComponent(action)}`);
    const res = await handle_response(response);
    return res.audits;
};

export const generateComplianceReport = async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const res = await handle_response(response);
    return res.report;
};

export const getComplianceReport = async (reportId) => {
    const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`);
    const res = await handle_response(response);
    return res.report;
};

export const getAllReports = async () => {
    const response = await fetch(`${API_BASE_URL}/api/reports`);
    const res = await handle_response(response);
    return res.reports;
};

async function handle_response(response) {
    const data = await response.json();
    if (response.ok === false) {
        const messageFromServer = data.error,
            defaultMessage = `Error: ${response.status}`;
        throw new Error(messageFromServer || defaultMessage);
    }
    return data;
}
