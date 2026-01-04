import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import TransactionForm from './TransactionForm';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Wallet, Trash2, ChevronDown, ChevronUp } from 'lucide-react';


const Dashboard = () => {
    const { transactions, deleteTransaction } = useTransactions();
    const [isInputExpanded, setIsInputExpanded] = useState(true);

    // Filter today's transactions and calculate totals
    const { todaysTransactions, income, expense } = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const filteredTransactions = transactions
            .filter(t => format(new Date(t.date), 'yyyy-MM-dd') === today)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Force Newest First

        const totalIncome = filteredTransactions
            .filter(t => t.type === 'sale')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const totalExpense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + curr.amount, 0);

        return { todaysTransactions: filteredTransactions, income: totalIncome, expense: totalExpense };
    }, [transactions]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Toggle Header for Overview */}
            <div
                onClick={() => setIsInputExpanded(!isInputExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    flexShrink: 0
                }}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Today's Overview</h2>
                <button className="btn" style={{ padding: '4px 8px', color: 'var(--color-text-muted)' }}>
                    {isInputExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {/* Collapsible Section: Summary Cards + Form */}
            {isInputExpanded && (
                <div style={{ animation: 'fadeIn 0.2s ease-out', flexShrink: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex' }}>
                                    <TrendingUp size={18} className="text-success" />
                                </div>
                                <span>Sales</span>
                            </div>
                            <div className="text-success font-bold" style={{ fontSize: '1.5rem' }}>
                                ₹{income.toFixed(2)}
                            </div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex' }}>
                                    <TrendingDown size={18} className="text-danger" />
                                </div>
                                <span>Expense</span>
                            </div>
                            <div className="text-danger font-bold" style={{ fontSize: '1.5rem' }}>
                                ₹{expense.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <TransactionForm />
                    </div>
                </div>
            )}

            {/* Divider if collapsed */}
            {!isInputExpanded && (
                <div style={{
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: '20px',
                    paddingBottom: '10px',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9rem',
                    flexShrink: 0
                }}>
                    <span style={{ marginRight: '16px' }}><span className="text-success">Sales: ₹{income.toFixed(0)}</span></span>
                    <span><span className="text-danger">Exp: ₹{expense.toFixed(0)}</span></span>
                </div>
            )}

            {/* Recent Activity Section (Scrollable) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Activity</h3>
                <button
                    onClick={() => setIsInputExpanded(!isInputExpanded)}
                    className="btn"
                    style={{ padding: '4px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    {isInputExpanded ? (
                        <>
                            <ChevronUp size={16} /> Collapse Overview
                        </>
                    ) : (
                        <>
                            <ChevronDown size={16} /> Expand Overview
                        </>
                    )}
                </button>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {todaysTransactions.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            No activity today yet.
                        </div>
                    ) : (
                        <div>
                            {todaysTransactions.map((t, index) => (
                                <div
                                    key={t.id}
                                    style={{
                                        padding: '16px',
                                        borderBottom: index !== todaysTransactions.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{t.description}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {format(new Date(t.date), 'h:mm a')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            fontWeight: '600',
                                            color: t.type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}>
                                            {t.type === 'sale' ? '+' : '-'}₹{Number(t.amount)}
                                        </div>
                                        <button
                                            onClick={() => deleteTransaction(t.id)}
                                            style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
                                            onMouseEnter={(e) => e.target.style.opacity = 1}
                                            onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
