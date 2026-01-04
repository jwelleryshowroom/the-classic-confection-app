import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

const PendingApproval = () => {
    const { user, logout } = useAuth();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ color: 'var(--color-warning)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                    <ShieldAlert size={48} />
                </div>
                <h1 style={{ color: 'var(--color-primary)', marginBottom: '10px', fontSize: '1.5rem' }}>Access Pending</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px' }}>
                    Hello <b>{user.displayName}</b>,<br /><br />
                    Your account is waiting for administrator approval. Please contact the admin to enable access for:
                    <br />
                    <code style={{ background: '#f1f5f9', padding: '4px', borderRadius: '4px', display: 'block', margin: '10px 0' }}>{user.email}</code>
                </p>

                <button
                    onClick={logout}
                    className="btn"
                    style={{ width: '100%', border: '1px solid var(--color-border)' }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );
};

export default PendingApproval;
