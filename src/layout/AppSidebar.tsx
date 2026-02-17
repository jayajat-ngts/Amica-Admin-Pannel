import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon, } from "@heroicons/react/24/outline";
// Assume these icons are imported from your icon library
import {
  BellIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  TicketIcon,
  TrophyIcon,
  UserCircleIcon,

} from "../icons";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// 👉 Main menu items (just 4)
const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
{
  icon: <UserCircleIcon />,
  name: "Staff",
  subItems: [
    {
      name: "Staff",
      path: "/staff",
      pro: false,
     
    },
    {
     name: "Role",
          path: "/staff/role",
          pro: false,},
  ],
  
},
// { icon: <UserCircleIcon />, name: "Chat", path: "/chat" },
{
  icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
  name: "Audit Logs",
  path: "/audit",
},

{
  icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
  name: "Chat",
  path: "/chat",
},

{
  icon: <CreditCardIcon className="w-5 h-5" />,
  name: "Subscription",
  path: "/subscription",
},
  { icon: <CalenderIcon />, name: "Match", path: "/matches" },
  { icon: <TrophyIcon />, name: "Contest", path: "/contest" },
  { icon: <ListIcon />, name: "Questions", path: "/questions" },
  { icon: <TicketIcon />, name: "Coupon Management", path: "/coupons" },
  { icon: <UserCircleIcon />, name: "User Management", path: "/users" },
  { icon: <BellIcon />, name: "Notifications", path: "/notifications" },
  { icon: <PageIcon />, name: "Banners", path: "/banners" },
];

// 👉 No “Others”
const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  // const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
  //   {}
  // );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // replace your isActive with this
  const isActive = useCallback(
    (path: string, exact = false) => {
      if (!path) return false;
      const loc = location.pathname || "/";

      // exact match (useful for root or when you want only exact)
      if (exact) return loc === path;

      // normalize trailing slash
      const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;
      const normalizedLoc = loc.endsWith("/") ? loc.slice(0, -1) : loc;

      // exact or child-route match (e.g. /contest or /contest/123)
      if (normalizedLoc === normalizedPath) return true;
      return normalizedLoc.startsWith(normalizedPath + "/");
    },
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        // setSubMenuHeight((prevHeights) => ({
        //   ...prevHeights,
        //   [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        // }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
       {nav.subItems ? (
  <>
    {/* Parent button */}
    <button
      onClick={() => handleSubmenuToggle(index, menuType)}
      className={`menu-item group ${
        openSubmenu?.type === menuType && openSubmenu?.index === index
          ? "menu-item-active"
          : "menu-item-inactive"
      } cursor-pointer ${
        !isExpanded && !isHovered
          ? "lg:justify-center"
          : "lg:justify-start"
      }`}
    >
      <span
        className={`menu-item-icon-size ${
          openSubmenu?.type === menuType && openSubmenu?.index === index
            ? "menu-item-icon-active"
            : "menu-item-icon-inactive"
        }`}
      >
        {nav.icon}
      </span>

      {(isExpanded || isHovered || isMobileOpen) && (
        <span className="menu-item-text">{nav.name}</span>
      )}

      {(isExpanded || isHovered || isMobileOpen) && (
        <ChevronDownIcon
          className={`ml-auto w-5 h-5 transition-transform duration-200 ${
            openSubmenu?.type === menuType &&
            openSubmenu?.index === index
              ? "rotate-180 text-brand-500"
              : ""
          }`}
        />
      )}
    </button>

    {/* ✅ Submenu */}
    {openSubmenu?.type === menuType &&
      openSubmenu?.index === index && (
        <ul className="ml-10 mt-2 flex flex-col gap-2">
          {nav.subItems.map((sub) => (
            <li key={sub.path}>
              <Link
                to={sub.path}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  isActive(sub.path)
                    ? "bg-brand-50 text-brand-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
  </>
) : (

            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Menu */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            {/* 👉 no "Others" section */}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
