import axios from "axios";
import { ADMIN_SESSION_KEY } from "../../constants/sessionKeys";

const envApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const API_BASE_URL = envApiUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "");

const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

if (!API_BASE_URL && !import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.error("Missing VITE_API_URL in production. Admin API requests may fail.");
}

adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_SESSION_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default adminApiClient;
