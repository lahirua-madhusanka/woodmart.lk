import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { StoreProvider } from "./context/StoreContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <App />
          <ToastContainer
            position="top-right"
            autoClose={2500}
            closeOnClick
            theme="light"
          />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);