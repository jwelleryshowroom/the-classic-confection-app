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
            alignItems: 'center', // Default center
            justifyContent: 'center',
            padding: '20px',
            // Mobile Specific Overrides via Class/Style
        }} className="modal-overlay">
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
            <div className="modal-content" style={{
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
                maxHeight: '85vh', // Slightly reduced to allow margin
                backdropFilter: 'blur(12px)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px', // Compact Header
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border)',
                    flexShrink: 0 // Prevent header from shrinking
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
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - SCROLLABLE */}
                <div style={{
                    padding: '20px 24px',
                    overflowY: 'auto', // ENABLE SCROLLING
                    overscrollBehavior: 'contain',
                    flex: 1 // Take remaining height
                }}>
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
                
                /* Mobile Bottom Sheet Styles */
                @media (max-width: 600px) {
                    .modal-overlay {
                        align-items: flex-end !important; /* Push to bottom */
                        padding: 0 !important; /* Full width */
                    }
                    .modal-content {
                        border-bottom-left-radius: 0 !important;
                        border-bottom-right-radius: 0 !important;
                        max-height: 90vh !important; /* Taller on mobile */
                        animation: slideUpMobile 0.3s ease-out !important;
                    }
                }
                @keyframes slideUpMobile {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Modal;
