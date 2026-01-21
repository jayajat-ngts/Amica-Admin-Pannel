// import axios from "axios";
// import { store } from "../store";
// import { logout } from "../features/auth/authSlice";

// // 🔹 change to your backend URL
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL;

// export const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Request interceptor → attach token
// api.interceptors.request.use(
//   (config) => {
//     const state = store.getState();
//     const token = state.auth.token;

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor → auto logout on 401
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       store.dispatch(logout());
//     }
//     return Promise.reject(error);
//   }
// );
import axios from "axios";

// 🔹 Backend base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   Request Interceptor
   Attach token from localStorage
========================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   Response Interceptor
   Auto logout on 401
========================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 🔥 Clear auth data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");

      // optional: redirect to login
      window.location.href = "/sign-in";
    }

    return Promise.reject(error);
  }
);
