import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Eye, EyeOff, Lock, Mail, X } from "lucide-react";
import { useAuth, type AuthResult } from "../context/AuthContext";

export type AuthMode = "signin" | "signup" | "reset";
type Mode = AuthMode;
type Fields = { email: string; password: string; confirm: string; code: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { email: "", password: "", confirm: "", code: "" };
const inputCls =
  "h-11 w-full rounded-lg border bg-bg pl-10 pr-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";

interface Props {
  initialMode?: AuthMode;
  onClose: () => void;
}

export default function AuthModal({ initialMode = "signin", onClose }: Props) {
  const auth = useAuth();
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [done, setDone] = useState<null | Mode>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  // "code" = Clerk emailed a one-time code (verify email, new-device check, or password reset).
  const [step, setStep] = useState<"form" | "code">("form");

  // Close on Escape and focus the first field when the modal opens.
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    document.getElementById(`${uid}-email`)?.focus();
    return () => document.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => {
    if (step === "code") document.getElementById(`${uid}-code`)?.focus();
  }, [step, uid]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep("form");
    setErrors({});
    setFormError("");
    setShow(false);
    setF((x) => ({ ...EMPTY, email: x.email }));
  };

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const google = async () => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      const res = await auth.signInWithGoogle();
      if (res.error) return setFormError(res.error);
      if (!auth.configured) setDone(mode === "signup" ? "signup" : "signin"); // demo mode: no redirect happens
    } catch {
      setFormError("Couldn't reach Google. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    const er: Errors = {};
    if (step === "code") {
      if (!f.code.trim()) er.code = "Enter the code from your email.";
      if (mode === "reset") {
        if (!f.password) er.password = "Enter a new password.";
        else if (f.password.length < 8) er.password = "Use at least 8 characters.";
        if (f.confirm !== f.password) er.confirm = "Passwords don't match.";
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = "Enter a valid email address.";
      if (mode !== "reset") {
        if (!f.password) er.password = "Enter your password.";
        else if (mode === "signup" && f.password.length < 8) er.password = "Use at least 8 characters.";
        if (mode === "signup" && f.confirm !== f.password) er.confirm = "Passwords don't match.";
      }
    }
    setErrors(er);
    const first = Object.keys(er)[0];
    if (first) return document.getElementById(id(first))?.focus();

    const email = f.email.trim();
    setBusy(true);
    setFormError("");
    try {
      let res: AuthResult;
      if (step === "code") res = mode === "reset" ? await auth.finishReset(f.code, f.password) : await auth.verifyCode(f.code);
      else if (mode === "signin") res = await auth.signIn(email, f.password);
      else if (mode === "signup") res = await auth.signUp(email, f.password);
      else res = await auth.startReset(email);

      if (res.error) return setFormError(res.error);
      if (res.step === "code") {
        setStep("code");
        setShow(false);
        setF((x) => ({ ...x, code: "", ...(mode === "reset" ? { password: "", confirm: "" } : {}) }));
        return;
      }
      setDone(mode);
    } catch {
      setFormError("Something went wrong. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = (k: keyof Fields, label: string, icon: JSX.Element, props: { type?: string; placeholder: string; auto?: string; trailing?: JSX.Element; inputMode?: "numeric" }) => (
    <div>
      <label htmlFor={id(k)} className="mb-1.5 block text-xs font-semibold text-ink">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
        <input
          id={id(k)}
          type={props.type ?? "text"}
          value={f[k]}
          onChange={set(k)}
          placeholder={props.placeholder}
          autoComplete={props.auto}
          inputMode={props.inputMode}
          aria-invalid={!!errors[k]}
          aria-describedby={errors[k] ? `${id(k)}-err` : undefined}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={`${inputCls} ${errors[k] ? "border-error" : "border-line"} ${props.trailing ? "pr-11" : ""}`}
        />
        {props.trailing}
      </div>
      {errors[k] && <p id={`${id(k)}-err`} role="alert" className="mt-1 text-xs text-error">{errors[k]}</p>}
    </div>
  );

  const eye = (
    <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-ink">
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );

  const shell = (children: JSX.Element, labelId: string) => (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="relative max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-md p-1.5 text-muted hover:bg-brand/10 hover:text-ink">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );

  if (done) {
    const msg = {
      signin: ["Welcome back!", "You're signed in to BookNest."],
      signup: ["Account created!", "Welcome to BookNest."],
      reset: ["Password updated", "You're signed in with your new password."],
    }[done];
    return shell(
      <div className="flex flex-col items-center pt-2 text-center">
        <CheckCircle2 size={44} className="mb-3 text-success" />
        <h2 id={`${uid}-title`} className="font-serif text-2xl font-bold text-ink">{msg[0]}</h2>
        <p className="mt-2 text-sm text-muted">{msg[1]}</p>
        <div className="mt-6 flex gap-3">
          <Link to="/profile" onClick={onClose} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand/10">My Profile</Link>
          <button onClick={onClose} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-[#14181F] hover:brightness-110">Explore books</button>
        </div>
      </div>,
      `${uid}-title`
    );
  }

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome back", "Sign in to continue exploring books."],
    signup: ["Join BookNest", "Create an account to save, share and follow."],
    reset: ["Reset password", "Enter your email and we'll send you a reset code."],
  };

  const [title, subtitle] =
    step === "code"
      ? mode === "reset"
        ? ["Check your email", `Enter the code we sent to ${f.email.trim()} and choose a new password.`]
        : ["Verify your email", `We sent a 6-digit code to ${f.email.trim()}.`]
      : titles[mode];

  return shell(
    <>
      <div className="mb-5 flex flex-col items-center pt-1 text-center">
        <BookOpen size={30} strokeWidth={1.8} className="mb-2 text-accent" />
        <h2 id={`${uid}-title`} className="font-serif text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      {mode !== "reset" && step === "form" && (
        <div role="tablist" className="mb-5 grid grid-cols-2 rounded-xl bg-bg p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className={`rounded-lg py-2 text-sm font-medium transition-colors ${mode === m ? "bg-brand/25 text-ink" : "text-muted hover:text-ink"}`}>
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>
      )}

      {mode !== "reset" && step === "form" && (
        <>
          <button type="button" onClick={google} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-bg py-3 text-sm font-semibold text-ink transition hover:bg-brand/10 disabled:cursor-wait disabled:opacity-70">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
              <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/>
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {step === "code" ? (
          <>
            {field("code", "Verification code", <Mail size={17} />, { placeholder: "6-digit code", auto: "one-time-code", inputMode: "numeric" })}
            {mode === "reset" && field("password", "New password", <Lock size={17} />, { type: show ? "text" : "password", placeholder: "At least 8 characters", auto: "new-password", trailing: eye })}
            {mode === "reset" && field("confirm", "Confirm new password", <Lock size={17} />, { type: show ? "text" : "password", placeholder: "Repeat your new password", auto: "new-password" })}
          </>
        ) : (
          <>
          {field("email", "Email", <Mail size={17} />, { type: "email", placeholder: "you@example.com", auto: "email" })}
          {mode !== "reset" && field("password", "Password", <Lock size={17} />, { type: show ? "text" : "password", placeholder: mode === "signup" ? "At least 8 characters" : "Enter your password", auto: mode === "signup" ? "new-password" : "current-password", trailing: eye })}
          {mode === "signup" && field("confirm", "Confirm password", <Lock size={17} />, { type: show ? "text" : "password", placeholder: "Repeat your password", auto: "new-password" })}

          {mode === "signin" && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-ink">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#DDB77E]" />
                Remember me
              </label>
              <button type="button" onClick={() => switchMode("reset")} className="text-accent hover:underline">Forgot password?</button>
            </div>
          )}
          </>
        )}

        {formError && <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">{formError}</p>}

        <button type="button" onClick={submit} disabled={busy} className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-[#14181F] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">
          {busy ? "Please wait…" : step === "code" ? (mode === "reset" ? "Reset password" : "Verify") : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset code"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {step === "code" ? (
          <button onClick={() => switchMode(mode)} className="text-accent hover:underline">Back</button>
        ) : mode === "reset" ? (
          <button onClick={() => switchMode("signin")} className="text-accent hover:underline">Back to sign in</button>
        ) : mode === "signin" ? (
          <>New to BookNest? <button onClick={() => switchMode("signup")} className="font-medium text-accent hover:underline">Create an account</button></>
        ) : (
          <>Already have an account? <button onClick={() => switchMode("signin")} className="font-medium text-accent hover:underline">Sign in</button></>
        )}
      </p>
    </>,
    `${uid}-title`
  );
}
