import React, { useState, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getISOWeek, getYear } from 'date-fns';
import { Trash2, AlertTriangle, Calendar, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';

const DataManagement = () => {
    const { transactions, deleteTransactionsByDateRange, clearAllTransactions } = useTransactions();
    const [confirmModal, setConfirmModal] = useState({ show: false, range: null, title: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'

    // Group transactions dynamically based on viewMode
    const groups = useMemo(() => {
        const grouped = {};
        transactions.forEach(t => {
            const date = parseISO(t.date);
            let key, label, start, end;

            if (viewMode === 'day') {
                key = format(date, 'yyyy-MM-dd');
                label = format(date, 'MMMM d, yyyy');
                start = startOfDay(date);
                end = endOfDay(date);
            } else if (viewMode === 'week') {
                start = startOfWeek(date, { weekStartsOn: 1 });
                end = endOfWeek(date, { weekStartsOn: 1 });
                key = `${getYear(date)}-W${getISOWeek(date)}`;
                label = `Week ${getISOWeek(date)} (${format(start, 'MMM d')} - ${format(end, 'MMM d')})`;
            } else {
                key = format(date, 'yyyy-MM');
                label = format(date, 'MMMM yyyy');
                start = startOfMonth(date);
                end = endOfMonth(date);
            }

            if (!grouped[key]) {
                grouped[key] = { label, count: 0, start, end };
            }
            grouped[key].count += 1;
        });

        // Convert to array and sort descending
        return Object.values(grouped).sort((a, b) => b.start - a.start);
    }, [transactions, viewMode]);

    const handleDeleteClick = (group) => {
        setConfirmModal({
            show: true,
            range: { start: group.start, end: group.end },
            title: `Delete ${viewMode === 'day' ? 'Day' : viewMode === 'week' ? 'Week' : 'Month'}?`,
            message: `Deleting: ${group.label}. This will remove ${group.count} transaction(s). This cannot be undone.`
        });
    };

    const handleClearAll = () => {
        setConfirmModal({
            show: true,
            range: 'all',
            title: 'Reset Everything?',
            message: 'DANGER: This will wipe the ENTIRE database. Every single record will be lost forever.'
        });
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            if (confirmModal.range === 'all') {
                await clearAllTransactions();
            } else {
                await deleteTransactionsByDateRange(
                    confirmModal.range.start.toISOString(),
                    confirmModal.range.end.toISOString()
                );
            }
            setConfirmModal({ show: false, range: null, title: '', message: '' });
        } catch (error) {
            alert("Error deleting data.");
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '0 4px', height: '100%', overflowY: 'auto' }}>
            {/* Header */}
            <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trash2 size={20} /> Data Management
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Select a view to delete specific groups of data. Only dates with data are shown.
                </p>
            </div>

            {/* Toggle Switch */}
            <div style={{ display: 'flex', marginBottom: '16px', backgroundColor: 'var(--color-bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                {['day', 'week', 'month'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: viewMode === mode ? 'var(--color-primary)' : 'transparent',
                            color: viewMode === mode ? 'white' : 'var(--color-text-muted)',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {/* Data List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '80px' }}>
                {groups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        <CheckCircle2 size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <p>No data found.</p>
                    </div>
                ) : (
                    groups.map((group, index) => (
                        <div key={index} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--color-primary)' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                                    {group.label}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {group.count} Record{group.count !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteClick(group)}
                                style={{
                                    padding: '8px',
                                    color: 'var(--color-danger)',
                                    backgroundColor: '#ffebee',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Danger Zone */}
            {groups.length > 0 && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button onClick={handleClearAll} style={{ color: 'var(--color-danger)', fontSize: '0.85rem', textDecoration: 'underline', fontWeight: 500 }}>
                        Dangerous: Reset Entire Database
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '85%', maxWidth: '320px', padding: '24px' }}>
                        <div style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{confirmModal.title}</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.4, fontSize: '0.95rem' }}>
                            {confirmModal.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setConfirmModal({ show: false, range: null, title: '', message: '' })}
                                className="btn"
                                style={{ flex: 1, backgroundColor: '#f0f0f0', color: '#666' }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn"
                                style={{ flex: 1, backgroundColor: 'var(--color-danger)', color: 'white' }}
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManagement;
