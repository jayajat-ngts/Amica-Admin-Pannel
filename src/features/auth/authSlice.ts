// src/features/auth/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id?: string | number;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  user: User | null;
  status: "idle" | "authenticated" | "unauthenticated";
  hasHydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  status: "idle",
  hasHydrated: false,
};

const STORAGE_KEY = "auth_state_v1";

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      try {
        const useSession = sessionStorage.getItem("AUTH_USE_SESSION") === "1";
        const raw = useSession
          ? sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY)
          : localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);

        if (raw) {
          const parsed = JSON.parse(raw);
          state.token = parsed.token ?? null;
          state.user = parsed.user ?? null;
          state.status = parsed.token ? "authenticated" : "unauthenticated";
        } else {
          state.token = null;
          state.user = null;
          state.status = "unauthenticated";
        }
      } catch {
        state.token = null;
        state.user = null;
        state.status = "unauthenticated";
      } finally {
        state.hasHydrated = true; // ✅ mark done
      }
    },
    loginSuccess(state, action: PayloadAction<{ token: string; user: User | null }>) {
      state.token = action.payload.token;
      state.user = action.payload.user ?? null;
      state.status = "authenticated";
      // Note: Storage is handled by the caller (SignInForm) to respect "Remember me" preference
      state.hasHydrated = true;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "unauthenticated";
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("AUTH_USE_SESSION");
      state.hasHydrated = true;
    },
    updateUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      const raw = JSON.stringify({ token: state.token, user: state.user });
      // persist to whichever store currently contains it
      if (sessionStorage.getItem("AUTH_USE_SESSION") === "1") {
        sessionStorage.setItem(STORAGE_KEY, raw);
      } else {
        localStorage.setItem(STORAGE_KEY, raw);
      }
    },
  },
});

export const { hydrateFromStorage, loginSuccess, logout, updateUser } = slice.actions;
export default slice.reducer;
