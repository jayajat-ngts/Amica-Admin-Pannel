import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import type { AxiosError } from "axios";
import { resetPasswordApi } from "../../api/auth";
import { EyeIcon, EyeCloseIcon } from "../../icons";

type ApiError = { message?: string; error?: string };
type AxiosErrorWithCode = AxiosError<ApiError> & { code?: string };

// individual rule tests
const ruleTests = {
  length: (v: string) => v.length >= 8,
  upper: (v: string) => /[A-Z]/.test(v),
  lower: (v: string) => /[a-z]/.test(v),
  number: (v: string) => /\d/.test(v),
  special: (v: string) => /[@$!%*?&()[\]{}#^_+\-=~|:;'",.<>\\/`]/.test(v),
};

function mapError(err: unknown): string {
  const e = err as AxiosErrorWithCode;
  const status = e?.response?.status;
  const msg =
    e?.response?.data?.message || e?.response?.data?.error || e?.message;

  if (status === 400 || status === 422)
    return msg || "Please check your input and try again.";
  if (status === 401) return msg || "Your reset link is invalid or expired.";
  if (status === 404) return msg || "Reset request not found.";
  if (status === 429) return "Too many requests. Please try again later.";
  if (status && status >= 500) return "Server error. Please try again shortly.";
  if (e?.code === "ECONNABORTED")
    return "Request timed out. Check your connection and try again.";
  if (e?.message?.toLowerCase?.().includes("network"))
    return "Network error. Check your internet.";
  return msg || "Something went wrong.";
}

export default function ResetPasswordForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token")?.trim() || "",
    [location.search]
  );
  const email = useMemo(
    () => new URLSearchParams(location.search).get("email")?.trim() || "",
    [location.search]
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // live rule states
  const rules = {
    length: ruleTests.length(password),
    upper: ruleTests.upper(password),
    lower: ruleTests.lower(password),
    number: ruleTests.number(password),
    special: ruleTests.special(password),
  };
  const allRulesPass = Object.values(rules).every(Boolean);
  const confirmMatches = password.length > 0 && password === confirm;

  const validate = () => {
    if (!token)
      return "Reset link is missing. Please use the link from your email again.";
    if (!password) return "New password is required.";
    if (!allRulesPass) return "Password must meet all the requirements.";
    if (!confirmMatches) return "Passwords do not match.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const v = validate();
    if (v) {
      toast.error(v);
      return;
    }

    try {
      setSubmitting(true);
      await resetPasswordApi({ token, password,email });
      toast.success("Password has been reset. You can now sign in.");
      setTimeout(() => navigate("/sign-in", { replace: true }), 1000);
    } catch (err) {
      const msg = mapError(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error(
        "Reset token is missing or invalid. Please open the link from your email again."
      );
    }
  }, [token]);

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto" />
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set a new password for your account.
            </p>
          </div>

          <div>
            <form onSubmit={onSubmit} noValidate>
              <div className="space-y-6">
                {/* New Password */}
                <div>
                  <Label>
                    New Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                      }
                      required
                      aria-invalid={!password ? "true" : "false"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 bg-transparent border-none p-0"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </button>
                  </div>

                  {/* Checklist - only show when user starts typing */}
                  {password.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      <ChecklistItem
                        ok={rules.upper}
                        label="One uppercase letter"
                      />
                      <ChecklistItem
                        ok={rules.lower}
                        label="One lowercase letter"
                      />
                      <ChecklistItem ok={rules.number} label="One number" />
                      <ChecklistItem
                        ok={rules.special}
                        label="One special character"
                      />
                      <ChecklistItem
                        ok={rules.length}
                        label="At least 8 characters"
                      />
                    </ul>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label>
                    Confirm Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfirm(e.target.value)
                      }
                      required
                      aria-invalid={
                        password.length > 0 && !confirmMatches
                          ? "true"
                          : "false"
                      }
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 bg-transparent border-none p-0"
                      aria-label={
                        showConfirm
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirm ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </button>
                  </div>
                  {password.length > 0 &&
                    confirm.length > 0 &&
                    !confirmMatches && (
                      <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                        Passwords do not match.
                      </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end">
                  <Link
                    to="/sign-in"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Back to sign in
                  </Link>
                </div>

                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={
                      submitting || !token || !allRulesPass || !confirmMatches
                    }
                  >
                    {submitting ? "Updating..." : "Update password"}
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

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={`flex items-center gap-2 ${
        ok
          ? "text-green-600 dark:text-green-400"
          : "text-error-600 dark:text-error-400"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${
          ok
            ? "border-green-500 bg-green-500/10"
            : "border-error-500 bg-error-500/10"
        }`}
      >
        {ok ? "✓" : "✕"}
      </span>
      <span>{label}</span>
    </li>
  );
}
