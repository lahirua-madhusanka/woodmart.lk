import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { evaluatePasswordStrength } from "../utils/passwordStrength";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Isolated component so useGoogleLogin errors never crash the entire AuthPage.
// Only rendered when GOOGLE_CLIENT_ID is set (provider is in the tree).
function GoogleLoginButton({ mode, onSuccess, onError, disabled }) {
  const googleLogin = useGoogleLogin({
    onSuccess,
    onError,
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {disabled ? "Please wait..." : mode === "login" ? "Continue with Google" : "Sign up with Google"}
    </button>
  );
}

function AuthPage() {
  const { isAuthenticated, loading, login, loginWithGoogle, register, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const redirectTarget = useMemo(
    () => location.state?.from || "/",
    [location.state]
  );

  const passwordStrength = useMemo(
    () => evaluatePasswordStrength(form.password),
    [form.password]
  );

  const passwordsMatch = form.password === form.confirmPassword;
  const isRegisterPasswordValid = mode !== "register" || passwordStrength.isStrong;
  const canSubmit = mode === "register"
    ? Boolean(form.name.trim() && form.email.trim() && form.password && form.confirmPassword && passwordsMatch)
    : Boolean(form.email.trim() && form.password);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, redirectTarget]);

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (inlineError) {
      setInlineError("");
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (mode === "register" && form.password !== form.confirmPassword) {
      setInlineError("Passwords do not match");
      return;
    }

    if (mode === "register" && !passwordStrength.isStrong) {
      setInlineError("Password is not strong enough");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        const response = await register({ name: form.name, email: form.email, password: form.password });
        if (response?.requiresVerification) {
          const nextEmail = response.email || form.email;
          setVerificationEmail(nextEmail);
          navigate(`/auth/check-email?email=${encodeURIComponent(nextEmail)}`, { replace: true });
          return;
        }
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error).toLowerCase();
      if (mode === "login" && message.includes("verify your email")) {
        setVerificationEmail(form.email);
      }
      if (mode === "register") {
        setInlineError(getApiErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onResendVerification = async () => {
    if (!verificationEmail || resending) return;
    setResending(true);
    try {
      await resendVerification({ email: verificationEmail });
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle(tokenResponse.access_token);
      navigate(redirectTarget, { replace: true });
    } catch {
      // Error already toasted inside loginWithGoogle
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <section className="container-pad py-10">
      <div className="mx-auto grid max-w-5xl gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-premium md:grid-cols-2 md:p-8">
        <aside className="rounded-2xl bg-gradient-to-br from-brand-dark via-brand to-[#0d75cc] p-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-light">Welcome to Woodmart.lk</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-3 text-sm text-brand-light">
            Save favorites, track orders, and enjoy a seamless premium shopping experience.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-brand-light">
            <li>Exclusive member offers</li>
            <li>Faster checkout experience</li>
            <li>Personalized product recommendations</li>
          </ul>
        </aside>

        <div className="p-2 md:p-4">
          <div className="mb-5 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
            <button
              onClick={() => setMode("login")}
              className={`rounded-md px-4 py-2 font-semibold ${
                mode === "login" ? "bg-white text-brand shadow" : "text-muted"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`rounded-md px-4 py-2 font-semibold ${
                mode === "register" ? "bg-white text-brand shadow" : "text-muted"
              }`}
            >
              Register
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "register" && (
              <label className="block text-sm">
                <span className="mb-1 block font-semibold">Full Name</span>
                <input
                  value={form.name}
                  onChange={onChange("name")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
                />
              </label>
            )}

            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Email Address</span>
              <input
                type="email"
                value={form.email}
                onChange={onChange("email")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={onChange("password")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {mode === "register" && form.password && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                  <span className="text-slate-600">Password Strength</span>
                  <span
                    className={
                      passwordStrength.level === "strong"
                        ? "text-green-600"
                        : passwordStrength.level === "medium"
                          ? "text-amber-600"
                          : "text-red-600"
                    }
                  >
                    {passwordStrength.level}
                  </span>
                </div>

                <div className="mb-3 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className={
                      passwordStrength.level === "strong"
                        ? "h-2 rounded-full bg-green-500"
                        : passwordStrength.level === "medium"
                          ? "h-2 rounded-full bg-amber-500"
                          : "h-2 rounded-full bg-red-500"
                    }
                    style={{ width: `${(passwordStrength.score / passwordStrength.maxScore) * 100}%` }}
                  />
                </div>

                <ul className="space-y-1 text-xs">
                  {passwordStrength.rules.map((rule) => (
                    <li key={rule.key} className={rule.passed ? "text-green-700" : "text-slate-600"}>
                      {rule.passed ? "✓" : "○"} {rule.label}
                    </li>
                  ))}
                </ul>

                {!passwordStrength.isStrong && (
                  <p className="mt-2 text-xs font-medium text-red-600">Password is not strong enough</p>
                )}
              </div>
            )}

            {mode === "register" && (
              <label className="block text-sm">
                <span className="mb-1 block font-semibold">Confirm Password</span>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={onChange("confirmPassword")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-700"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <span className="mt-1 block text-xs text-red-600">Passwords do not match</span>
                )}
              </label>
            )}

            {inlineError && mode === "register" && (
              <p className="text-sm text-red-600">{inlineError}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>

            <div className="relative my-2 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-muted">or</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {GOOGLE_CLIENT_ID ? (
              <GoogleLoginButton
                mode={mode}
                onSuccess={handleGoogleSuccess}
                onError={() => setInlineError("Google Sign-In failed. Please try again.")}
                disabled={googleSubmitting}
              />
            ) : (
              <button
                type="button"
                onClick={() => toast.info("Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.")}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {mode === "login" ? "Continue with Google" : "Sign up with Google"}
              </button>
            )}

            {mode === "login" && (
              <p className="text-sm text-muted">
                Forgot your password? <Link to="/auth/forgot-password" className="font-semibold text-brand">Reset here</Link>
              </p>
            )}

            {mode === "login" && verificationEmail && (
              <div className="rounded-lg border border-brand/30 bg-brand/5 p-3 text-sm text-slate-700">
                <p>
                  Need a verification email for <strong>{verificationEmail}</strong>?
                </p>
                <button
                  type="button"
                  onClick={onResendVerification}
                  disabled={resending}
                  className="mt-2 font-semibold text-brand disabled:opacity-60"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            )}

          </form>
        </div>
      </div>
    </section>
  );
}

export default AuthPage;