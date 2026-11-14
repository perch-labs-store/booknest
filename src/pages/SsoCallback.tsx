import { HandleSSOCallback } from "@clerk/react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

/** Where Google sends people back to. Clerk finishes the sign-in (or creates the account), then we go home. */
export default function SsoCallback() {
  const { configured } = useAuth();
  const navigate = useNavigate();
  const { open } = useAuthModal();
  if (!configured) return <Navigate to="/" replace />;
  return (
    <HandleSSOCallback
      navigateToApp={() => navigate("/", { replace: true })}
      // Extra verification is needed: reopen the normal sign-in form, which can handle it.
      navigateToSignIn={() => { navigate("/", { replace: true }); open("signin"); }}
      navigateToSignUp={() => { navigate("/", { replace: true }); open("signup"); }}
    />
  );
}
