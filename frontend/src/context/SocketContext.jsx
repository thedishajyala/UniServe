import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const getSocketURL = () => {
            if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
            return 'http://localhost:5001';
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
