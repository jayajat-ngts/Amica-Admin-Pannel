import { RootState } from "../../store";
export const selectAuth = (s: RootState) => s.auth;
export const selectAuthReady = (s: RootState) => s.auth.hasHydrated;
export const selectIsAuthenticated = (s: RootState) => !!s.auth.token;
