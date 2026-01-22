import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import ForgetPassword from "./pages/AuthPages/ForgetPassword";
import NotFound from "./pages/OtherPage/NotFound";
import Calendar from "./pages/Calendar";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import PrivateRoute from "./routes/PrivateRoute";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import { useAppSelector } from "./store/hooks";
import {
  selectAuthReady,
  selectIsAuthenticated,
} from "./features/auth/selectors";


import Matches from "./pages/Matches";
import Contest from "./pages/Contest";
import Coupons from "./pages/Coupons";
import Users from "./pages/Users";
import Questions from "./pages/Question";
import LiveScore from "./pages/LiveScore";
import CreateContest from "./pages/Contest/CreateContest";
import CreateQuestion from "./pages/Question/CreateQuestion";
import UserDetail from "./pages/Users/UserDetail";
import Notifications from "./pages/Notifications";
import Banners from "./pages/Banners";
import Staff from "./pages/Staff/page";
import CreateStaffPage from "./components/staff/CreateStaff";
import RoleManagementPage from "./components/staff/StaffRole";
import ChatHistoryPage from "./components/chat/ChatHistory";
import EditStaffPage from "./components/staff/EditStaff";

export default function App() {
  const ready = useAppSelector(selectAuthReady);
  const isAuthed = useAppSelector(selectIsAuthenticated);

  if (!ready) {
    // optional: splash or null to avoid redirect flicker
    return null;
  }
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Auth Layout */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* <Route path="/signup" element={<SignUp />} /> */}

        {/* Dashboard Layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route index path="/dashboard" element={<Home />} />
             <Route path="/staff" element={<Staff />} />
             <Route path="/staff/create" element={<CreateStaffPage />} />
              <Route path="/staff/role" element={<RoleManagementPage />} />
              <Route path="/staff/edit/:id" element={<EditStaffPage />} />

            <Route path="/chat" element={<ChatHistoryPage />} />
            {/* Tables */}
            <Route path="/matches" element={<Matches />} />
            <Route path="/live-score/:matchId" element={<LiveScore />} />
            <Route path="/contest" element={<Contest />} />
            <Route path="/contest/create" element={<CreateContest />} />
            <Route path="/contest/:id" element={<Contest />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/questions/:id" element={<Questions />} />
            <Route path="/questions/create" element={<CreateQuestion />} />
            <Route path="/questions/:id/create" element={<CreateQuestion />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:userId" element={<UserDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/banners" element={<Banners />} />

            {/* Others Page */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
          </Route>
        </Route>
        <Route
          path="/dashboard"
          element={isAuthed ? <Home /> : <Navigate to="/sign-in" replace />}
        />
        <Route
          path="/"
          element={
            <Navigate to={isAuthed ? "/dashboard" : "/sign-in"} replace />
          }
        />
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </Router>
  );
}
