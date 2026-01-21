import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import { hydrateFromStorage } from "./features/auth/authSlice";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { Toaster } from "sonner";

store.dispatch(hydrateFromStorage());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <AppWrapper>
          <Toaster richColors closeButton position="top-right" />

          <App />
        </AppWrapper>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
