import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { FollowProvider } from "./context/FollowContext";
import { LibraryProvider } from "./context/LibraryContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AuthModalProvider>
            <ProfileProvider>
              <FollowProvider>
                <LibraryProvider>
                  <App />
                </LibraryProvider>
              </FollowProvider>
            </ProfileProvider>
          </AuthModalProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
