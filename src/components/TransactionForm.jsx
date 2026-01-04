import React, { useState } from 'react';
import { PlusCircle, MinusCircle, AlertCircle } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

const TransactionForm = () => {
    const { addTransaction } = useTransactions();
    const [type, setType] = useState('sale'); // 'sale' or 'expense'
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [titleError, setTitleError] = useState('');
    const [shake, setShake] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Custom Validation
        if (!amount || isNaN(parseFloat(amount))) {
            setTitleError('Please enter a valid amount');
            setShake(true);
            setTimeout(() => setShake(false), 500); // Remove shake class after animation
            return;
        }

        addTransaction({
            type,
            amount: parseFloat(amount),
            description: description || (type === 'sale' ? 'Sale' : 'Expense'),
            date: new Date().toISOString()
        });

        setAmount('');
        setDescription('');
        setTitleError('');
    };

    return (
        <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    type="button"
                    className={`btn btn-modern ${type === 'sale' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, backgroundColor: type === 'sale' ? 'var(--color-success)' : '#e2e8f0', color: type === 'sale' ? 'white' : 'inherit' }}
                    onClick={() => setType('sale')}
                >
                    <PlusCircle size={18} /> Daily Sale
                </button>
                <button
                    type="button"
                    className={`btn btn-modern ${type === 'expense' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, backgroundColor: type === 'expense' ? 'var(--color-danger)' : '#e2e8f0', color: type === 'expense' ? 'white' : 'inherit' }}
                    onClick={() => setType('expense')}
                >
                    <MinusCircle size={18} /> Expense
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className={`input-group ${shake ? 'shake' : ''}`} style={{ position: 'relative' }}>
                    {titleError && (
                        <div className="modern-tooltip" style={{ bottom: '100%', marginBottom: '8px' }}>
                            {titleError}
                        </div>
                    )}
                    <label className="input-label">Amount (₹)</label>
                    <input
                        type="number"
                        className="input-field"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value);
                            if (titleError) setTitleError(''); // Clear error on type
                        }}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Description (Optional)</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder={type === 'sale' ? "e.g. Morning Sales" : "e.g. Vegetables, Rent"}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    Add {type === 'sale' ? 'Sale' : 'Expense'}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
