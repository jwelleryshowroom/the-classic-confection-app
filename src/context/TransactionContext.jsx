import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, getDocs, where } from 'firebase/firestore';
import { useToast } from './ToastContext';

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
    const { showToast } = useToast();

    useEffect(() => {
        // Real-time listener for transactions
        const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            showToast("Failed to sync data.", "error");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [showToast]);

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
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error batch deleting transactions:", error);
            throw error;
        }
    };

    const clearAllTransactions = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'transactions'));
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error clearing all transactions:", error);
            throw error;
        }
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, deleteTransactionsByDateRange, clearAllTransactions, loading }}>
            {children}
        </TransactionContext.Provider>
    );
};
