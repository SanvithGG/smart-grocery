import {
  BarChart3,
  Boxes,
  BadgeCheck,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  MoonStar,
  SunMedium,
  ShoppingCart,
  Tags,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../utils/session";
import "./AdminShell.css";

const ADMIN_THEME_STORAGE_KEY = "smart-grocery-admin-theme";

function AdminShell() {
  const navigate = useNavigate();
  const { username } = getSession();
  const accountRef = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  });

  const isDark = theme === "dark";

  const navClassName = ({ isActive }) =>
    [
      "group flex items-center gap-3 overflow-hidden rounded-full border px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
      isActive
        ? "border-slate-950 bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
        : "border-transparent bg-transparent text-slate-600 hover:border-white/80 hover:bg-white/80 hover:text-slate-900",
    ].join(" ");

  const navigationItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/products", label: "Products", icon: Boxes },
    { to: "/admin/categories", label: "Categories", icon: Tags },
    {
      to: "/admin/purchase-queue",
      label: "Purchase Queue",
      icon: ShoppingCart,
    },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  ];

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const handleThemeToggle = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const accountLabel = username || "admin";
  const accountInitial = accountLabel.charAt(0).toUpperCase() || "A";

  return (
    <div
      className={`admin-shell min-h-screen text-slate-900 ${isDark ? "admin-theme-dark" : "admin-theme-light"}`}
    >
      <header className="border-b border-white/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-inner">
              <CircleUserRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">
                Admin Workspace
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Smart Grocery control center
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Signed in as {username || "admin"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-[28px] border border-white/80 bg-white/80 p-2 shadow-sm">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navClassName}
                aria-label={item.label}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                        isActive ? "scale-100 text-sky-300" : "scale-95"
                      }`}
                    />
                    <span
                      className={`whitespace-nowrap text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? "max-w-40 translate-x-0 opacity-100"
                          : "max-w-0 -translate-x-2 opacity-0 group-hover:max-w-40 group-hover:translate-x-0 group-hover:opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label={
                isDark ? "Switch to light theme" : "Switch to dark theme"
              }
              title={isDark ? "Light theme" : "Dark theme"}
              className={`group flex items-center gap-3 overflow-hidden rounded-full border px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
                isDark
                  ? "border-slate-950 bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
                  : "border-transparent bg-transparent text-slate-600 hover:border-white/80 hover:bg-white/80 hover:text-slate-900"
              }`}
            >
              {isDark ? (
                <SunMedium className="h-4 w-4 shrink-0 text-amber-300 transition-transform duration-300" />
              ) : (
                <MoonStar className="h-4 w-4 shrink-0 transition-transform duration-300" />
              )}
              <span
                className={`whitespace-nowrap text-sm font-semibold transition-all duration-300 ${
                  isDark
                    ? "max-w-32 translate-x-0 opacity-100"
                    : "max-w-0 -translate-x-2 opacity-0 group-hover:max-w-32 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {isDark ? "Light" : "Dark"}
              </span>
            </button>
          </div>

          <div className="relative flex items-center gap-3" ref={accountRef}>
            <button
              type="button"
              aria-label="Open account"
              onClick={() => setAccountOpen((current) => !current)}
              className={`admin-avatar-button ${accountOpen ? "admin-avatar-button-active" : ""}`}
            >
              <span className="admin-avatar-ring">
                <span className="admin-avatar-core">{accountInitial}</span>
              </span>
              <span className="admin-tooltip">Account</span>
            </button>

            {accountOpen && (
              <div className="admin-account-panel absolute right-0 top-16 z-50 w-88 rounded-4xl p-4 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur">
                <div className="rounded-[28px] px-5 py-5 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    {accountLabel}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <span className="admin-avatar-ring admin-avatar-ring-large">
                      <span className="admin-avatar-core admin-avatar-core-large">
                        {accountInitial}
                      </span>
                    </span>
                  </div>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                    Hi, {accountLabel}!
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Smart Grocery admin workspace
                  </p>
                </div>

                <div className="mt-4 rounded-[28px] p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-base font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminShell;
