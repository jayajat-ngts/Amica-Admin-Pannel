import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import type { AxiosError } from "axios";
import { requestPasswordReset } from "../../api/auth";

type ApiError = { message?: string; error?: string };
type AxiosErrorWithCode = AxiosError<ApiError> & { code?: string };

function mapError(err: unknown): string {
  const e = err as AxiosErrorWithCode;
  const status = e?.response?.status;
  const data = e?.response?.data;
  const apiMessage = data?.message || data?.error || e?.message;

  if (status === 400 || status === 422) return apiMessage || "Please enter a valid email.";
  if (status === 404) return apiMessage || "We couldn't find an account with that email.";
  if (status === 429) return "Too many requests. Please try again later.";
  if (status && status >= 500) return "Server error. Please try again shortly.";
  if (e?.code === "ECONNABORTED") return "Request timed out. Check your connection and try again.";
  if (e?.message?.toLowerCase?.().includes("network")) return "Network error. Check your internet.";
  return apiMessage || "Something went wrong.";
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Email is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestPasswordReset({ email: trimmed });

      // ✅ handle response
      if (res.success) {
        toast.success("Password reset link sent. Please check your email.");
        setTimeout(() => navigate("/sign-in", { replace: true }), 1500);
      } else {
        toast(res.message || "If that email exists, a reset link has been sent.");
      }
    } catch (err) {
      const msg = mapError(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto" />
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Forgot password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we’ll send you a password reset link.
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
                    placeholder="you@example.com"
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

                <div className="flex items-center justify-end">
                  <Link
                    to="/sign-in"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Back to sign in
                  </Link>
                </div>

                <div>
                  <Button className="w-full" size="sm" disabled={submitting}>
                    {submitting ? "Sending..." : "Send reset link"}
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
