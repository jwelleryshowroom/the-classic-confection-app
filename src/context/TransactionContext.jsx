import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, getDocs, where, getAggregateFromServer, sum } from 'firebase/firestore';
import { useToast } from './useToast';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { TransactionContext } from './TransactionContextDef';

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
    const setViewDateRange = React.useCallback((startDate, endDate) => {
        // Optimization: Prevent re-fetching if the range hasn't effectively changed
        // We compare the timestamps of the intended start/end against the current state
        const s = startOfDay(startDate);
        const e = endOfDay(endDate);

        setCurrentRange(prev => {
            if (prev.start.getTime() === s.getTime() && prev.end.getTime() === e.getTime()) {
                return prev; // No change, skip update
            }
            setLoading(true);
            return {
                start: s,
                end: e
            };
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
                const { id: _, ...dataToRestore } = transactionToDelete;
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
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            showToast(`Cleared ${snapshot.size} records.`, "success");
        } catch (error) {
            console.error("Error deleting data range:", error);
            showToast("Failed to clear data.", "error");
        }
    };

    const clearAllTransactions = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'transactions'));
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            showToast("Database wiped successfully.", "success");
        } catch (error) {
            console.error("Error clearing database:", error);
            showToast("Failed to wipe database.", "error");
        }
    };

    /**
     * Fetches aggregated stats (Sum of Sales, Sum of Expenses) directly from Firestore.
     * efficient for large datasets as it doesn't download documents.
     */
    const getFinancialStats = React.useCallback(async (startDate, endDate) => {
        try {
            const coll = collection(db, 'transactions');

            let salesQuery;
            let expensesQuery;

            // Check if asking for "All Time" (e.g., startDate is Epoch 1970)
            // If so, we omit the date filter to use the default single-field index on 'type'
            // instead of requiring a composite index (type + date).
            const isAllTime = startDate.getFullYear() === 1970;

            if (isAllTime) {
                salesQuery = query(coll, where('type', '==', 'sale'));
                expensesQuery = query(coll, where('type', '==', 'expense'));
            } else {
                salesQuery = query(
                    coll,
                    where('type', '==', 'sale'),
                    where('date', '>=', startDate.toISOString()),
                    where('date', '<=', endDate.toISOString())
                );

                expensesQuery = query(
                    coll,
                    where('type', '==', 'expense'),
                    where('date', '>=', startDate.toISOString()),
                    where('date', '<=', endDate.toISOString())
                );
            }

            try {
                const [salesSnapshot, expensesSnapshot] = await Promise.all([
                    getAggregateFromServer(salesQuery, { total: sum('amount') }),
                    getAggregateFromServer(expensesQuery, { total: sum('amount') })
                ]);

                const totalSales = salesSnapshot.data().total || 0;
                const totalExpense = expensesSnapshot.data().total || 0;

                return {
                    totalSales,
                    totalExpense,
                    netProfit: totalSales - totalExpense
                };
            } catch (aggregationError) {
                console.warn("Aggregation failed (likely missing index). Falling back to client-side calculation.", aggregationError);

                // Fallback: Fetch all documents matching the query and sum manually
                // This uses more bandwidth but avoids the index requirement
                const [salesDocs, expensesDocs] = await Promise.all([
                    getDocs(salesQuery),
                    getDocs(expensesQuery)
                ]);

                const totalSales = salesDocs.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
                const totalExpense = expensesDocs.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);

                return {
                    totalSales,
                    totalExpense,
                    netProfit: totalSales - totalExpense
                };
            }
        } catch (error) {
            console.error("Error in getFinancialStats:", error);
            return null;
        }
    }, [showToast]);

    const value = {
        transactions,
        loading,
        currentRange,
        setViewDateRange,
        addTransaction,
        deleteTransaction,
        deleteTransactionsByDateRange,
        clearAllTransactions,
        getFinancialStats
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
};
