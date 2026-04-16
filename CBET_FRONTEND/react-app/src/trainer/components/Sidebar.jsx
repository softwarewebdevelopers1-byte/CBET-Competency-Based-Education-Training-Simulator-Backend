import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import styles from "../../admin/styles/Sidebar.module.css";

const clearStoredAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("cbet_user");
  localStorage.removeItem("admin_user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("cbet_user");
  sessionStorage.removeItem("admin_user");
};

const Sidebar = ({ collapsed, setCollapsed }) => {
  const menuItems = [
    { path: "/trainer/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/trainer/units", icon: BookOpen, label: "Assigned Units" },
    { path: "/trainer/assessments", icon: ListChecks, label: "Assessments" },
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
      {!collapsed && window.innerWidth <= 768 && (
        <div className={styles.mobileOverlay} onClick={() => setCollapsed(true)} />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoText}>Trainer Hub</span>
            <span className={styles.logoIcon}>T</span>
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
            >
              <item.icon size={20} />
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={`${styles.navItem} ${styles.logoutBtn}`}
            onClick={handleLogout}
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
