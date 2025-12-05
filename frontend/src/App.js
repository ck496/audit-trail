import { useState } from 'react'
import Navbar from './components/Navbar'
import UserManagement from './components/UserManagement'
import AuditLogs from './components/AuditLogs'
import ComplianceReports from './components/ComplianceReports'

function App() {
    const [activeTab, setActiveTab] = useState('users_page'),
        [recentUsers, setRecentUsers] = useState([]);

    const curr_component = () => {
        switch (activeTab) {
            case 'users_page':
                return (
                    <UserManagement addUser={addUser} recentUsers={recentUsers} />
                );
            case 'audit_logs_page':
                return <AuditLogs />;
            case 'compliance_page':
                return <ComplianceReports />;
            default:
                return <UserManagement addUser={addUser} recentUsers={recentUsers} />;
        }
    };

    const addUser = (new_user) => setRecentUsers((prev_users) => [new_user, ...prev_users])

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main> {curr_component()} </main>
        </div>
    );
}

export default App;
