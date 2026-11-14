import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";

type Mode = "signin" | "signup" | "reset";
type Fields = { name: string; email: string; password: string; confirm: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: "", email: "", password: "", confirm: "" };
const inputCls =
  "h-11 w-full rounded-lg border bg-bg pl-10 pr-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";

export default function Login() {
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [mode, setMode] = useState<Mode>("signin");
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [done, setDone] = useState<null | Mode>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setShow(false);
    setF((x) => ({ ...EMPTY, email: x.email }));
  };

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = () => {
    const er: Errors = {};
    if (mode === "signup" && !f.name.trim()) er.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = "Enter a valid email address.";
    if (mode !== "reset") {
      if (!f.password) er.password = "Enter your password.";
      else if (mode === "signup" && f.password.length < 8) er.password = "Use at least 8 characters.";
      if (mode === "signup" && f.confirm !== f.password) er.confirm = "Passwords don't match.";
    }
    setErrors(er);
    const first = Object.keys(er)[0];
    if (first) return document.getElementById(id(first))?.focus();
    setDone(mode); // demo only: no backend yet
  };

  const field = (k: keyof Fields, label: string, icon: JSX.Element, props: { type?: string; placeholder: string; auto?: string; trailing?: JSX.Element }) => (
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

  if (done) {
    const msg = {
      signin: ["Welcome back!", "You're signed in to BookNest."],
      signup: ["Account created!", `Welcome to BookNest, ${f.name.trim().split(" ")[0]}.`],
      reset: ["Check your email", `If an account exists for ${f.email}, we've sent a reset link.`],
    }[done];
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 size={44} className="mb-3 text-success" />
        <h1 className="font-serif text-2xl font-bold text-ink">{msg[0]}</h1>
        <p className="mt-2 text-sm text-muted">{msg[1]}</p>
        <div className="mt-6 flex gap-3">
          {done === "reset" ? (
            <button onClick={() => { setDone(null); switchMode("signin"); }} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-[#14181F] hover:brightness-110">Back to sign in</button>
          ) : (
            <>
              <Link to="/profile" className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand/10">My Profile</Link>
              <Link to="/" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-[#14181F] hover:brightness-110">Start reading</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome back", "Sign in to continue your reading journey."],
    signup: ["Join BookNest", "Create an account to save, share and follow."],
    reset: ["Reset password", "Enter your email and we'll send you a reset link."],
  };

  return (
    <div className="mx-auto mt-4 w-full max-w-md sm:mt-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <BookOpen size={36} strokeWidth={1.8} className="mb-3 text-accent" />
        <h1 className="font-serif text-3xl font-bold text-ink">{titles[mode][0]}</h1>
        <p className="mt-1 text-sm text-muted">{titles[mode][1]}</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        {mode !== "reset" && (
          <div role="tablist" className="mb-5 grid grid-cols-2 rounded-xl bg-bg p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className={`rounded-lg py-2 text-sm font-medium transition-colors ${mode === m ? "bg-brand/25 text-ink" : "text-muted hover:text-ink"}`}>
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>
        )}

        <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {mode === "signup" && field("name", "Full name", <User size={17} />, { placeholder: "Your name", auto: "name" })}
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

          <button type="button" onClick={submit} className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-[#14181F] transition hover:brightness-110">
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {mode === "reset" ? (
            <button onClick={() => switchMode("signin")} className="text-accent hover:underline">Back to sign in</button>
          ) : mode === "signin" ? (
            <>New to BookNest? <button onClick={() => switchMode("signup")} className="font-medium text-accent hover:underline">Create an account</button></>
          ) : (
            <>Already have an account? <button onClick={() => switchMode("signin")} className="font-medium text-accent hover:underline">Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
