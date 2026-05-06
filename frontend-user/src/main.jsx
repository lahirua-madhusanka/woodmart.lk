import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AdminAuthProvider } from "../../src/context/AdminAuthContext";
import { ChatRealtimeProvider } from "../../src/context/ChatRealtimeContext";
import { StorefrontSettingsProvider } from "../../src/context/StorefrontSettingsContext";
import { UserAuthProvider } from "../../src/context/UserAuthContext";
import UserApp from "../../src/apps/UserApp";
import { Analytics } from "@vercel/analytics/react";
import "../../src/index.css";
import "react-toastify/dist/ReactToastify.css";
import { StoreProvider } from "../../src/context/StoreContext";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "monospace" }}>
          <h2 style={{ color: "red" }}>Something went wrong</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
            {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function AppProviders({ children }) {
  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
  }
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <StorefrontSettingsProvider>
            <UserAuthProvider>
              <AdminAuthProvider>
                <ChatRealtimeProvider>
                  <StoreProvider>
                    <UserApp />
                    <Analytics />
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
    </AppErrorBoundary>
  </React.StrictMode>
);

