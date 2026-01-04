import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(null);

    const login = () => {
        return signInWithPopup(auth, googleProvider);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setIsAllowed(null); // Reset to null to trigger loading state while checking
                try {
                    // Check if user exists in 'authorized_users' collection
                    const docRef = doc(db, "authorized_users", currentUser.email);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setIsAllowed(true);
                    } else {
                        console.warn("User email not found in authorized_users collection.");
                        setIsAllowed(false);
                    }
                } catch (error) {
                    console.error("Error checking authorization:", error);
                    setIsAllowed(false);
                }
            } else {
                setIsAllowed(false);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        user,
        isAllowed,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

