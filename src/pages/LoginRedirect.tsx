import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";

/** Keeps old /login links working: opens the auth modal over the home page. */
export default function LoginRedirect() {
  const { open } = useAuthModal();
  useEffect(() => open("signin"), [open]);
  return <Navigate to="/" replace />;
}
