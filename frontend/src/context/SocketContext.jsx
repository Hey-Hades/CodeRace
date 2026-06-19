import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

// Point this to your backend server port
const SOCKET_URL = 'http://localhost:5000'; 

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. Initialize the connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // 2. Log when connected
    newSocket.on('connect', () => {
      console.log('🔌 Connected to CodeRace Server! ID:', newSocket.id);
    });

    // 3. Clean up the connection if the app unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// A custom hook to easily grab the socket in any component
export const useSocket = () => {
  return useContext(SocketContext);
};