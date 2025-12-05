import { useState } from 'react'
import { registerUser } from '../services/api'
import './UserManagement.css'

const UserManagement = ({ addUser, recentUsers }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: 'USER',
        organization: '',
        permissions: '',
    });
    const [loading, setLoading] = useState(false),
        [error, setError] = useState(null),
        [success, setSuccess] = useState(null);

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }) }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Convert permissions string to array
            const userData = {
                ...formData,
                permissions: formData.permissions.split(',').map(p => p.trim()).filter(p => p)
            };
            const result = await registerUser(userData);
            setSuccess(result);
            addUser(result);
            // Reset form
            setFormData({
                username: '',
                email: '',
                role: 'USER',
                organization: '',
                permissions: '',
            });
        } catch (err) { setError(err.message) }
        finally { setLoading(false) }
    };

    return (
        <div className="cred_section">
            <h2>User Management</h2>
            <div className="card">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="e.g. alice_admin"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="alice@example.com" />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="USER">USER</option>
                            <option value="AUDITOR">AUDITOR</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Organization</label>
                        <input type="text" name="organization" value={formData.organization} onChange={handleChange} required placeholder="Org1" />
                    </div>
                    <div className="form-group full-width">
                        <label>Permissions (comma-separated)</label>
                        <textarea name="permissions" value={formData.permissions} onChange={handleChange} placeholder="e.g. READ_AUDIT, WRITE_AUDIT, MANAGE_USERS" rows="2"
                        />
                    </div>
                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Registering...' : 'Register User'}
                        </button>
                    </div>
                </form>
            </div>

            {error && <div className="alert error">{error}</div>}

            {success && (
                <div className="alert success">
                    <h3>User Registered Successfully!</h3>
                    <p><strong>ID:</strong> {success.id}</p>
                    <p><strong>Username:</strong> {success.username}</p>
                    <p><strong>Role:</strong> {success.role}</p>
                </div>
            )}

            <div className="recent-credentials">
                <h3>Recent Users</h3>
                {recentUsers.length === 0 ? (
                    <p className="empty-state">No users registered yet in this session.</p>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Organization</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td>{user.organization}</td>
                                        <td>
                                            <span className={`badge ${user.active ? 'active' : 'revoked'}`}>
                                                {user.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
