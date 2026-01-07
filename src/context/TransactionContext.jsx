import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, getDocs, where } from 'firebase/firestore';
import { useToast } from './ToastContext';
import { startOfMonth, endOfMonth, parseISO, startOfDay, endOfDay } from 'date-fns';

const TransactionContext = createContext();

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
};

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    // Default range: Current Month
    const [currentRange, setCurrentRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });
    const { showToast } = useToast();

    useEffect(() => {
        setLoading(true);
        // Optimized Listener: Only listen to the requested range
        const q = query(
            collection(db, 'transactions'),
            where('date', '>=', currentRange.start.toISOString()),
            where('date', '<=', currentRange.end.toISOString()),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            // Ignore specialized index errors initially, as they might pop up before index is built
            if (error.code !== 'failed-precondition') {
                showToast("Failed to sync data.", "error");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentRange, showToast]);

    // Function to update the view (Components call this to switch context)
    // Function to update the view (Components call this to switch context)
    const setViewDateRange = React.useCallback((startDate, endDate) => {
        // Ensure we cover the full day boundaries
        setCurrentRange({
            start: startOfDay(startDate),
            end: endOfDay(endDate)
        });
    }, []);

    const addTransaction = async (transaction) => {
        try {
            await addDoc(collection(db, 'transactions'), {
                ...transaction,
                date: transaction.date || new Date().toISOString(), // Use provided date or new
                createdAt: new Date().toISOString()
            });
            // Silent success (User requested removal of notification)
        } catch (error) {
            console.error("Error adding transaction:", error);
            showToast("Failed to add transaction. Check connection.", "error");
        }
    };

    const deleteTransaction = async (id) => {
        // Find transaction data before deleting for Undo capability
        const transactionToDelete = transactions.find(t => t.id === id);

        try {
            await deleteDoc(doc(db, 'transactions', id));

            if (transactionToDelete) {
                const { id, ...dataToRestore } = transactionToDelete;
                showToast("Transaction deleted.", "info", {
                    label: "UNDO",
                    onClick: () => addTransaction(dataToRestore) // Re-add clean data
                });
            } else {
                showToast("Transaction deleted.", "info");
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            showToast("Failed to delete transaction.", "error");
        }
    };

    const deleteTransactionsByDateRange = async (startDate, endDate) => {
        try {
            const q = query(
                collection(db, 'transactions'),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );
            const snapshot = await getDocs(q);

            // Firestore Batch has a limit of 500 operations
            const docs = snapshot.docs;
            for (let i = 0; i < docs.length; i += 500) {
                const batch = writeBatch(db);
                const chunk = docs.slice(i, i + 500);
                chunk.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
        } catch (error) {
            console.error("Error batch deleting transactions:", error);
            throw error;
        }
    };

    const clearAllTransactions = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'transactions'));
            const docs = snapshot.docs;

            for (let i = 0; i < docs.length; i += 500) {
                const batch = writeBatch(db);
                const chunk = docs.slice(i, i + 500);
                chunk.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
        } catch (error) {
            console.error("Error clearing all transactions:", error);
            throw error;
        }
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            addTransaction,
            deleteTransaction,
            deleteTransactionsByDateRange,
            clearAllTransactions,
            loading,
            setViewDateRange, // New API
            currentRange      // Expose current range state
        }}>
            {children}
        </TransactionContext.Provider>
    );
};
