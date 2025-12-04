import './Navbar.css';

const Navbar = ({ activeTab, setActiveTab }) => {
    const audit_categories = [
        { id: 'users_page', label: 'User Management' },
        { id: 'audit_logs_page', label: 'Audit Logs' },
        { id: 'compliance_page', label: 'Compliance Reports' },
    ];

    return (
        <nav className="navbar">
            <div className="navbar_tite">AuditTrail</div>
            <div className="navbar_items">
                {audit_categories.map((cat) => (
                    <button key={cat.id} className={`nav-link ${activeTab === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(cat.id)}>
                        {cat.label}
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
