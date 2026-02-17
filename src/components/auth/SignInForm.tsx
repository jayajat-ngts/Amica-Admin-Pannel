import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { BackendUser, loginApi } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { User } from "../../features/auth/authSlice";
import { useAppSelector } from "../../store/hooks";
import { selectIsAuthenticated } from "../../features/auth/selectors";

/** ------- DEV TOGGLE ------- */

/** Type your API error payload once and reuse everywhere */
type ApiError = { message?: string; error?: string };
type AxiosErrorWithCode = AxiosError<ApiError> & { code?: string };

function mapLoginError(err: unknown): string {
  const axiosErr = err as AxiosErrorWithCode;
  const status = axiosErr?.response?.status;
  const data = axiosErr?.response?.data;
  const apiMessage = data?.message || data?.error || axiosErr?.message;

  if (status === 400 || status === 422)
    return apiMessage || "Please check your email and password.";
  if (status === 401)
    return apiMessage || "Invalid credentials. Please try again.";
  if (status === 429)
    return "Too many attempts. Please wait a moment and try again.";
  if (status && status >= 500)
    return "Server is unavailable right now. Please try again shortly.";
  if (axiosErr?.code === "ECONNABORTED")
    return "Request timed out. Check your connection and try again.";
  if (axiosErr?.message?.toLowerCase?.().includes("network"))
    return "Network error. Please check your internet connection.";
  return apiMessage || "Unable to sign in.";
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => {
    // Initialize remember based on current storage preference
    // If there's no AUTH_USE_SESSION flag, it means localStorage is being used (remember = true)
    return sessionStorage.getItem("AUTH_USE_SESSION") !== "1";
  });
  const [email, setEmail] = useState(() => {
    // Prefill email if remember me is enabled
    try {
      const isRemembered = sessionStorage.getItem("AUTH_USE_SESSION") !== "1";
      if (isRemembered) {
        const savedCreds = localStorage.getItem("saved_credentials");
        if (savedCreds) {
          const parsed = JSON.parse(savedCreds);
          return parsed.email || "";
        }
      }
    } catch {
      // ignore errors
    }
    return "";
  });
  const [password, setPassword] = useState(() => {
    // Prefill password if remember me is enabled
    try {
      const isRemembered = sessionStorage.getItem("AUTH_USE_SESSION") !== "1";
      if (isRemembered) {
        const savedCreds = localStorage.getItem("saved_credentials");
        if (savedCreds) {
          const parsed = JSON.parse(savedCreds);
          return parsed.password || "";
        }
      }
    } catch {
      // ignore errors
    }
    return "";
  });
  const [submitting, setSubmitting] = useState(false);

  const isAuthed = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "/dashboard";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) return toast.error("Email is required.");
    if (!/^\S+@\S+\.\S+$/.test(trimmed))
      return toast.error("Please enter a valid email address.");
    if (!password) return toast.error("Password is required.");

    try {
      setSubmitting(true);

      const data = await loginApi({ email: trimmed, password });

      const user: User = { ...(data.user as BackendUser) };
      
      // Set storage preference BEFORE calling login
      const RAW_KEY = "auth_state_v1";
      const authData = JSON.stringify({ token: data.token, user });
      
      try {
        if (remember) {
          // Store in localStorage for persistent login
          localStorage.setItem(RAW_KEY, authData);
          sessionStorage.removeItem(RAW_KEY);
          sessionStorage.removeItem("AUTH_USE_SESSION");
          
          // Save credentials for prefill
          localStorage.setItem("saved_credentials", JSON.stringify({ 
            email: trimmed, 
            password 
          }));
        } else {
          // Store in sessionStorage for session-only login
          sessionStorage.setItem(RAW_KEY, authData);
          sessionStorage.setItem("AUTH_USE_SESSION", "1");
          localStorage.removeItem(RAW_KEY);
          
          // Clear saved credentials
          localStorage.removeItem("saved_credentials");
        }
      } catch {
        /* ignore storage issues */
      }

      // Now update Redux state
      login(data.token, user);

      toast.success("Signed in successfully");
      navigate(next, { replace: true });
    } catch (err: unknown) {
      toast.error(mapLoginError(err));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAuthed) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthed, navigate]);

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto" />
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In{" "}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>

          </div>

          <div>
            <form onSubmit={onSubmit} noValidate>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="you@amica.in"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    required
                    aria-invalid={!email ? "true" : "false"}
                  />
                </div>

                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                      }
                      autoComplete="current-password"
                      required
                      aria-invalid={!password ? "true" : "false"}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 bg-transparent border-none p-0"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={remember} onChange={setRemember} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/forget-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div>
                  <Button className="w-full" size="sm" disabled={submitting}>
                    {submitting ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
