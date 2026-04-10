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
        const SOCKET_URL = getSocketURL();
        const newSocket = io(SOCKET_URL, { 
            autoConnect: true,
            withCredentials: true,
        });
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
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
