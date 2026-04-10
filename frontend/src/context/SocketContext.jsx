import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const getSocketURL = () => {
            if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
            
            // Automatically switch based on environment
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return 'http://localhost:5001';
            }
            
            // Fallback for Vercel deployment to hit the Render socket server
            // (Note: Socket URL is usually the same as the base backend URL without /api)
            return 'https://uniserve-backend-s2w0.onrender.com';
        };
        const url = getSocketURL();
        console.log('🔌 Connecting to Socket Hub:', url);

        const newSocket = io(url, {
            path: '/socket.io',
            withCredentials: true,
            transports: ['polling', 'websocket'], 
            reconnectionAttempts: 7,
            timeout: 20000,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ SIGNAL_LOCKED:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.warn('⚠️ CONNECTION_STUTTER:', err.message);
        });

        newSocket.on('reconnect', (attempt) => {
            console.log('🔄 SIGNAL_REGAINED after', attempt, 'attempts');
        });

        return () => {
            newSocket.disconnect();
            console.log('🔌 Disconnected from Signal Tower');
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    const context = useContext(SocketContext);
    return context;
};
