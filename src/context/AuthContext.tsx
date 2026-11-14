import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ClerkProvider, useAuth as useClerkAuth, useClerk, useSignIn, useSignUp } from "@clerk/react";

/** "code" means Clerk emailed a one-time code and the UI must ask for it next. */
export type AuthStep = "done" | "code";
export interface AuthResult {
  error: string | null;
  step: AuthStep;
}

interface AuthValue {
  signedIn: boolean;
  /** True while Clerk restores the saved session on first load. */
  loading: boolean;
  /** False in demo mode (no Clerk key): every call succeeds without doing anything. */
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  /** Next step after signIn / signUp returned step "code" (new-device check or email verification). */
  verifyCode: (code: string) => Promise<AuthResult>;
  /** Emails a reset code. Follow with finishReset(). */
  startReset: (email: string) => Promise<AuthResult>;
  finishReset: (code: string, newPassword: string) => Promise<AuthResult>;
  /** Redirects to Google, then back to /sso-callback. Resolves with an error only if the redirect could not start. */
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const DONE: AuthResult = { error: null, step: "done" };
const CODE: AuthResult = { error: null, step: "code" };
const fail = (error: string): AuthResult => ({ error, step: "done" });

/** Clerk errors carry a friendly `longMessage` ("That password has appeared in a data breach…"). */
const messageOf = (e: unknown) => {
  const err = e as { longMessage?: string; message?: string } | null;
  return err?.longMessage || err?.message || "Something went wrong. Please try again.";
};

/**
 * Wraps the app. With VITE_CLERK_PUBLISHABLE_KEY set it uses Clerk; without it the
 * sign-in modal still works as a demo so the mockup runs with zero setup.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  if (!PUBLISHABLE_KEY) {
    console.warn("[BookNest] VITE_CLERK_PUBLISHABLE_KEY is missing, so sign-in runs in demo mode. See .env.example.");
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ClerkAuthProvider>{children}</ClerkAuthProvider>
    </ClerkProvider>
  );
}

function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  // Which flow is waiting for a code, so verifyCode() knows what to verify.
  const pending = useRef<"signin" | "signup">("signin");

  /** Makes the finished attempt the active session. */
  const finish = useCallback(async (attempt: typeof signIn | typeof signUp): Promise<AuthResult> => {
    let blockedByTask = false;
    const { error } = await attempt.finalize({
      // We stay on the current page; just notice if Clerk wants an extra setup step (e.g. enforced MFA setup).
      navigate: ({ session }) => {
        if (session?.currentTask) blockedByTask = true;
      },
    });
    if (error) return fail(messageOf(error));
    if (blockedByTask) return fail("Your account needs an extra setup step that BookNest doesn't support yet.");
    return DONE;
  }, []);

  const signInFn = useCallback<AuthValue["signIn"]>(
    async (email, password) => {
      if (!isLoaded) return fail("Still loading. Try again in a moment.");
      const { error } = await signIn.password({ emailAddress: email, password });
      if (error) return fail(messageOf(error));
      if (signIn.status === "complete") return finish(signIn);

      // New device ("client trust") or MFA: Clerk wants an emailed code on top of the password.
      if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
        if (!signIn.supportedSecondFactors.some((f) => f.strategy === "email_code")) {
          return fail("This account uses a verification method BookNest doesn't support yet.");
        }
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) return fail(messageOf(sent.error));
        pending.current = "signin";
        return CODE;
      }
      return fail("Couldn't finish signing in. Please try again.");
    },
    [isLoaded, signIn, finish]
  );

  const signUpFn = useCallback<AuthValue["signUp"]>(
    async (email, password) => {
      if (!isLoaded) return fail("Still loading. Try again in a moment.");
      // The author name is collected right after sign-up (WelcomePrompt), not here.
      const res = await signUp.password({ emailAddress: email, password });
      if (res.error) return fail(messageOf(res.error));
      if (signUp.status === "complete") return finish(signUp);

      if (signUp.unverifiedFields.includes("email_address")) {
        const sent = await signUp.verifications.sendEmailCode();
        if (sent.error) return fail(messageOf(sent.error));
        pending.current = "signup";
        return CODE;
      }
      return fail("Sign-up needs more details than BookNest collects. Check the required fields in your Clerk dashboard.");
    },
    [isLoaded, signUp, finish]
  );

  const verifyCode = useCallback<AuthValue["verifyCode"]>(
    async (code) => {
      if (pending.current === "signup") {
        const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
        if (error) return fail(messageOf(error));
        return signUp.status === "complete" ? finish(signUp) : fail("Couldn't verify that code. Please try again.");
      }
      const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });
      if (error) return fail(messageOf(error));
      return signIn.status === "complete" ? finish(signIn) : fail("Couldn't verify that code. Please try again.");
    },
    [signIn, signUp, finish]
  );

  const startReset = useCallback<AuthValue["startReset"]>(
    async (email) => {
      if (!isLoaded) return fail("Still loading. Try again in a moment.");
      const created = await signIn.create({ identifier: email });
      if (created.error) return fail(messageOf(created.error));
      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) return fail(messageOf(sent.error));
      return CODE;
    },
    [isLoaded, signIn]
  );

  const finishReset = useCallback<AuthValue["finishReset"]>(
    async (code, newPassword) => {
      const verified = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
      if (verified.error) return fail(messageOf(verified.error));
      const saved = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword });
      if (saved.error) return fail(messageOf(saved.error));
      return signIn.status === "complete" ? finish(signIn) : fail("Your password was changed, but extra verification is needed. Please sign in.");
    },
    [signIn, finish]
  );

  const signInWithGoogle = useCallback<AuthValue["signInWithGoogle"]>(async () => {
    if (!isLoaded) return fail("Still loading. Try again in a moment.");
    // One call covers both sign in and sign up: Clerk creates the account if this Google user is new.
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: `${window.location.origin}/`,
      redirectCallbackUrl: `${window.location.origin}/sso-callback`,
    });
    return error ? fail(messageOf(error)) : DONE;
  }, [isLoaded, signIn]);

  const signOut = useCallback(async () => {
    await clerk.signOut();
  }, [clerk]);

  const value = useMemo<AuthValue>(
    () => ({
      signedIn: Boolean(isSignedIn),
      loading: !isLoaded,
      configured: true,
      signIn: signInFn,
      signUp: signUpFn,
      verifyCode,
      startReset,
      finishReset,
      signInWithGoogle,
      signOut,
    }),
    [isSignedIn, isLoaded, signInFn, signUpFn, verifyCode, startReset, finishReset, signInWithGoogle, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Same interface without a backend, so the mockup still demos the full flow. */
function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const value = useMemo<AuthValue>(
    () => ({
      signedIn,
      loading: false,
      configured: false,
      signIn: async () => (setSignedIn(true), DONE),
      signUp: async () => (setSignedIn(true), DONE),
      verifyCode: async () => (setSignedIn(true), DONE),
      startReset: async () => CODE,
      finishReset: async () => (setSignedIn(true), DONE),
      signInWithGoogle: async () => (setSignedIn(true), DONE),
      signOut: async () => setSignedIn(false),
    }),
    [signedIn, setSignedIn]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
