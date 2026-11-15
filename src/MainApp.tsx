import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { FollowProvider } from "./context/FollowContext";
import { LibraryProvider } from "./context/LibraryContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import { AuthProvider } from "./context/AuthContext";

/** The normal BookNest app with all its providers. Loaded by main.tsx unless the visit is to an author's published site. */
export default function MainApp() {
  return (
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
  );
}
