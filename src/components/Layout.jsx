import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Header = ({ setCurrentView }) => {
    const { user, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    React.useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    setDeferredPrompt(null);
                }
            });
        }
    };

    return (
        <header style={{
            padding: '16px 0',
            marginBottom: '10px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0 // Prevent header from shrinking
        }}>
            <div>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    lineHeight: 1.2,
                    fontFamily: '"Playfair Display", serif',
                    letterSpacing: '-0.5px'
                }}>
                    The Classic Confection
                </h1>
                <p style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    margin: 0,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Sales & Expense Tracker
                </p>
            </div>

            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <User size={20} />
                </button>

                {showMenu && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        backgroundColor: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        padding: '8px',
                        width: '200px',
                        zIndex: 1000
                    }}>
                        <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.displayName || 'User'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                        </div>

                        {deferredPrompt && (
                            <button
                                onClick={handleInstallClick}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-primary)',
                                    fontSize: '0.9rem',
                                    borderRadius: 'var(--radius-sm)',
                                    justifyContent: 'flex-start',
                                    marginBottom: '4px',
                                    fontWeight: 600
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Install App
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setCurrentView('settings');
                                setShowMenu(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--color-text-main)',
                                fontSize: '0.9rem',
                                borderRadius: 'var(--radius-sm)',
                                justifyContent: 'flex-start',
                                marginBottom: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            Manage Data
                        </button>

                        <button
                            onClick={logout}
                            style={{
                                width: '100%',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--color-danger)',
                                fontSize: '0.9rem',
                                borderRadius: 'var(--radius-sm)',
                                justifyContent: 'flex-start'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-body)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

const Layout = ({ children, setCurrentView }) => {
    return (
        <div className="container">
            <Header setCurrentView={setCurrentView} />
            <main style={{
                flex: 1,
                minHeight: 0, // Critical for nested scroll
                overflow: 'hidden', // Contain scrolling to children
                display: 'flex',
                flexDirection: 'column'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
