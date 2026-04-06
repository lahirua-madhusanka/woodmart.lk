import { io } from "socket.io-client";

const envSocketUrl = String(import.meta.env.VITE_SOCKET_URL || "").trim();
const envApiUrl = String(import.meta.env.VITE_API_URL || "").trim();

const apiOrigin = envApiUrl ? envApiUrl.replace(/\/api\/?$/, "") : "";
const SOCKET_BASE_URL = envSocketUrl || apiOrigin || (import.meta.env.DEV ? "http://localhost:5000" : "");

let socketInstance = null;
let activeToken = "";

export const getSocket = (token) => {
  if (!token) {
    return null;
  }

  if (socketInstance && activeToken === token) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  activeToken = token;
  socketInstance = io(SOCKET_BASE_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: { token },
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  activeToken = "";
};
