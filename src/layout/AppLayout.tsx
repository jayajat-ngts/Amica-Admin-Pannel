import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useLocation } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const location = useLocation();

  // ✅ routes jahan sidebar nahi chahiye
 
  // const hideSidebar = hideSidebarRoutes.includes(location.pathname);
  
  // ✅ routes where sidebar + header should be hidden
  const hideSidebar =
    location.pathname.startsWith("/staff/create") ||
    location.pathname.startsWith("/staff/edit") 
  

  return (
    <div className="min-h-screen xl:flex bg-gray-50">
      {/* ================= Sidebar ================= */}
      {!hideSidebar && (
        <div>
          <AppSidebar />
          <Backdrop />
        </div>
      )}

      {/* ================= Main Content ================= */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out
          ${
            hideSidebar
              ? "ml-0"
              : isExpanded || isHovered
              ? "lg:ml-[290px]"
              : "lg:ml-[90px]"
          }
          ${isMobileOpen && !hideSidebar ? "ml-0" : ""}
        `}
      >
        {/* Header */}
        {!hideSidebar && <AppHeader />}

        {/* Page Content */}
        <div
          className={`mx-auto ${
            hideSidebar
              ? "p-0"
              : "p-4 md:p-6 max-w-(--breakpoint-2xl)"
          }`}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
