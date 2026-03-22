import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('uniserve_token');
        
        // Safety: If for some reason the app stays loading too long, unlock it
        const safety = setTimeout(() => {
            if (loading) {
                console.warn('Auth loading timed out, unlocking app safety gate');
                setLoading(false);
            }
        }, 8000); 

        if (token) {
            getProfile()
                .then((res) => {
                    setUser(res.data);
                })
                .catch(() => {
                    localStorage.removeItem('uniserve_token');
                    setUser(null);
                })
                .finally(() => {
                    clearTimeout(safety);
                    setLoading(false);
                });
        } else {
            clearTimeout(safety);
            setLoading(false);
        }
        return () => clearTimeout(safety);
    }, []);

    const loginUser = (userData, token) => {
        localStorage.setItem('uniserve_token', token);
        setUser(userData);
    };

    const logoutUser = () => {
        localStorage.removeItem('uniserve_token');
        setUser(null);
    };

    const updateUser = (data) => {
        setUser((prev) => ({ ...prev, ...data }));
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
