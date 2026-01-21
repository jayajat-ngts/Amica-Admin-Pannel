import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useNavigate, useLocation } from "react-router";

interface Options {
  when?: "auth" | "guest";
  redirectTo?: string;
}

export function useAuthenticated(
  options: Options = { when: "auth", redirectTo: "/sign-in" }
) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const when = options.when ?? "auth";
  const redirectTo = options.redirectTo ?? (when === "auth" ? "/sign-in" : "/dashboard");

  useEffect(() => {
    if (when === "auth" && !isAuthenticated) {
      navigate(redirectTo + `?next=${encodeURIComponent(location.pathname + location.search)}`);
    }
    if (when === "guest" && isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, when, redirectTo, navigate, location]);
}
