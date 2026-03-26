// components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  BookOpen,
  FileText,
  FolderOpen,
  Trophy,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import styles from "../styles/sidebar.module.css";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const menuItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/users", icon: Users, label: "User Management" },
    { path: "/admin/simulations", icon: Gamepad2, label: "Simulations" },
    { path: "/admin/materials", icon: BookOpen, label: "Learning Materials" },
    { path: "/admin/assessments", icon: FileText, label: "AI Assessments" },
    { path: "/admin/portfolio", icon: FolderOpen, label: "Portfolio Review" },
    { path: "/admin/gamification", icon: Trophy, label: "Gamification" },
    { path: "/admin/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles["sidebar-header"]}>
        <div className={styles.logo}>
          {!collapsed && <span className={styles["logo-text"]}>CBET Simulator</span>}
          {collapsed && <span className={styles["logo-icon"]}>C</span>}
        </div>
        <button
          className={styles["collapse-btn"]}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className={styles["sidebar-nav"]}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `${styles["nav-item"]} ${isActive ? styles.active : ""}`
            }
            data-tooltip={collapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!collapsed && <span className={styles["nav-label"]}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={styles["sidebar-footer"]}>
        <button 
          className={`${styles["nav-item"]} ${styles["logout-btn"]}`}
          onClick={() => {
            // Handle logout logic
            console.log("Logout clicked");
          }}
          data-tooltip={collapsed ? "Logout" : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span className={styles["nav-label"]}>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;