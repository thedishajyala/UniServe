import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('uniserve_token');
        if (token) {
            getProfile()
                .then((res) => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('uniserve_token');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
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
