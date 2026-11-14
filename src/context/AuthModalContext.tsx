import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import AuthModal, { type AuthMode } from "../components/AuthModal";

interface AuthModalValue {
  /** Opens the sign in / sign up / reset modal. */
  open: (mode?: AuthMode) => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalValue | null>(null);

/** Renders the auth modal on top of whatever page is showing. Must sit inside the router. */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode | null>(null);
  const open = useCallback((m: AuthMode = "signin") => setMode(m), []);
  const close = useCallback(() => setMode(null), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {/* Mounted only while open, so the form starts fresh every time. */}
      {mode && <AuthModal initialMode={mode} onClose={close} />}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside <AuthModalProvider>");
  return ctx;
}
