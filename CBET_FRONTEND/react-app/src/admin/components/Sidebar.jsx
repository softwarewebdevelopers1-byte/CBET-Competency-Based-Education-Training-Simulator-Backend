// components/Sidebar.jsx
import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Link2,
  FolderOpen,
  Trophy,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import styles from "../styles/Sidebar.module.css";
import { useTheme } from "../../contexts/ThemeContext";

const clearStoredAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("cbet_user");
  localStorage.removeItem("admin_user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("cbet_user");
  sessionStorage.removeItem("admin_user");
};

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const menuItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/users", icon: Users, label: "User Management" },
    { path: "/admin/unit-assignments", icon: Link2, label: "Unit Management" },
    { path: "/admin/materials", icon: BookOpen, label: "Learning Materials" },
    { path: "/admin/assessments", icon: FileText, label: "Assessments" },
    { path: "/admin/portfolio", icon: FolderOpen, label: "Portfolio Review" },
    { path: "/admin/gamification", icon: Trophy, label: "Gamification" },
    { path: "/admin/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = async () => {
    try {
      await fetch("https://cbet-competency-based-education-training.onrender.com/auth/CBET/user/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearStoredAuthData();
      window.location.href = "/login";
    }
  };

  // Close sidebar when clicking a link on mobile
  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (!collapsed && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [collapsed]);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && window.innerWidth <= 768 && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoText}>CBET Simulator</span>
            <span className={styles.logoIcon}>C</span>
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ""}`
              }
              data-tooltip={item.label}
              onClick={handleNavClick}
            >
              <item.icon size={20} />
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>

          <button
            className={styles.navItem}
            onClick={toggleTheme}
            data-tooltip={theme === 'light' ? "Dark Mode" : "Light Mode"}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className={styles.navLabel}>{theme === 'light' ? "Dark Mode" : "Light Mode"}</span>
          </button>

          <button
            className={`${styles.navItem} ${styles.logoutBtn}`}
            onClick={handleLogout}
            data-tooltip="Logout"
          >
            <LogOut size={20} />
            <span className={styles.navLabel}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
