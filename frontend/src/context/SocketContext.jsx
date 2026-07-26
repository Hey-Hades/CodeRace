import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./socketStore.js";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://coderace-5xw6.onrender.com";
console.log("🚀 Socket URL:", SOCKET_URL);

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => io(SOCKET_URL), [SOCKET_URL]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔌 Connected:", socket.id);
    });

    return () => socket.disconnect();
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

