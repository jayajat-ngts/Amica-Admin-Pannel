import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import {
  loginSuccess,
  logout as doLogout,
  updateUser,
} from "../features/auth/authSlice";
import type { User } from "../features/auth/authSlice";

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user, status } = useSelector((s: RootState) => s.auth);
  const isAuthenticated = status === "authenticated" && !!token;

  return {
    token,
    user,
    status,
    isAuthenticated,
    login: (token: string, user: User | null = null) =>
      dispatch(loginSuccess({ token, user })),
    logout: () => dispatch(doLogout()),
    setUser: (u: User) => dispatch(updateUser(u)),
  };
}
