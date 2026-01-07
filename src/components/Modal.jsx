import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
            />

            {/* Content */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '450px',
                backgroundColor: 'var(--color-bg-surface-transparent)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--color-border)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                backdropFilter: 'blur(12px)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--color-bg-secondary)';
                            e.target.style.color = 'var(--color-text-main)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--color-text-muted)';
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', overflow: 'visible' }}>
                    {children}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Modal;
