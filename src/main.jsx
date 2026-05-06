import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ChatRealtimeProvider } from "./context/ChatRealtimeContext";
import { StorefrontSettingsProvider } from "./context/StorefrontSettingsContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { StoreProvider } from "./context/StoreContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function AppProviders({ children }) {
  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
  }
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <StorefrontSettingsProvider>
          <UserAuthProvider>
            <AdminAuthProvider>
              <ChatRealtimeProvider>
                <StoreProvider>
                  <App />
                  <ToastContainer
                    position="top-right"
                    autoClose={2500}
                    closeOnClick
                    theme="light"
                  />
                </StoreProvider>
              </ChatRealtimeProvider>
            </AdminAuthProvider>
          </UserAuthProvider>
        </StorefrontSettingsProvider>
      </BrowserRouter>
    </AppProviders>
  </React.StrictMode>
);