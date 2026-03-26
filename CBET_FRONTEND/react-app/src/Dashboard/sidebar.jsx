// src/components/common/Sidebar.jsx

import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "../css/sidebar.module.css";
import {
  FiHome,
  FiBookOpen,
  FiFileText,
  FiAward,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiFolder,
  FiCpu,
  FiUser,
  FiBell,
  FiSettings,
  FiSun,
  FiMoon,
} from "react-icons/fi";

const clearStoredAuthData = () => {
  localStorage.removeItem("cbet_user");
  localStorage.removeItem("token");
  localStorage.removeItem("admin_user");
  sessionStorage.removeItem("cbet_user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("admin_user");
};

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("cbet_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

export function Sidebar({
  collapsed: collapsedProp,
  onToggle,
  coursesInfo,
  themeMode,
  onToggleTheme,
}) {
  console.log("course info", coursesInfo);

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    typeof collapsedProp === "boolean" ? collapsedProp : internalCollapsed;
  const navigate = useNavigate();
  let userInfo = readStoredUser();

  useEffect(() => {
    if (!userInfo) {
      clearStoredAuthData();
      navigate("/login");
    }
  }, [navigate, userInfo]);

  if (!userInfo) {
    return null;
  }

  // Mock student data - replace with actual user data from props or store
  const student = {
    name: userInfo.user || "User",
    program: userInfo.programme,
    year: "Year 2",
    studentId: userInfo.code,
  };

  const handleLogout = async () => {
    let res = await fetch("http://localhost:8000/auth/CBET/user/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    clearStoredAuthData();
    navigate("/login");
  };

  const toggleSidebar = () => {
    if (typeof onToggle === "function") {
      onToggle();
    } else {
      setInternalCollapsed((c) => !c);
    }
  };

  // Student-only navigation items
  const navItems = [
    { path: "/dashboard", icon: <FiHome />, label: "Dashboard" },
    { path: "/courses", icon: <FiBookOpen />, label: "My Courses" },
    { path: "/scenarios", icon: <FiCpu />, label: "Interactive Scenarios" },
    { path: "/assessments", icon: <FiFileText />, label: "Assessments" },
    { path: "/portfolio", icon: <FiFolder />, label: "My Portfolio" },
    { path: "/achievements", icon: <FiAward />, label: "Achievements" },
  ];

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Sidebar Header */}
      <div className={styles.sidebarHeader}>
        {!collapsed ? (
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎓</span>
            <span className={styles.logoText}>CBET Student</span>
          </div>
        ) : (
          <span className={styles.logoIconSmall}>🎓</span>
        )}

        <button onClick={toggleSidebar} className={styles.toggleBtn}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {/* Student Info */}
      <div className={styles.studentInfo}>
        <div className={styles.studentAvatar}>
          {student.firstName?.charAt(0) || <FiUser />}
        </div>
        {!collapsed && (
          <div className={styles.studentDetails}>
            <p className={styles.studentName}>{student.name}</p>
            <p className={styles.studentProgram}>{student.program}</p>
            <p className={styles.studentId}>ID: {student.studentId}</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {!collapsed && (
        <div className={styles.quickStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>85%</span>
            <span className={styles.statLabel}>Avg. Score</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>12</span>
            <span className={styles.statLabel}>Badges</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>7</span>
            <span className={styles.statLabel}>Streak</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && (
              <span className={styles.navLabel}>{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Notifications */}
      {!collapsed && (
        <div className={styles.notifications}>
          <div className={styles.notificationHeader}>
            <FiBell />
            <span>Updates</span>
            <span className={styles.notificationBadge}>3</span>
          </div>
          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <span className={styles.notificationDot}></span>
              <span className={styles.notificationText}>
                Network Security Quiz due tomorrow
              </span>
            </div>
            <div className={styles.notificationItem}>
              <span className={styles.notificationDot}></span>
              <span className={styles.notificationText}>
                New scenario: Ethical Hacking Basics
              </span>
            </div>
            <div className={styles.notificationItem}>
              <span className={styles.notificationDot}></span>
              <span className={styles.notificationText}>
                Your portfolio was reviewed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        {!collapsed && (
          <>
            <button
              onClick={onToggleTheme}
              className={styles.footerActionBtn}
              type="button"
            >
              {themeMode === "dark" ? <FiSun /> : <FiMoon />}
              <span>{themeMode === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <NavLink to="/profile" className={styles.footerItem}>
              <FiUser />
              <span>My Profile</span>
            </NavLink>
            <NavLink to="/settings" className={styles.footerItem}>
              <FiSettings />
              <span>Settings</span>
            </NavLink>
          </>
        )}
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <FiLogOut />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapsed Stats */}
      {collapsed && (
        <div className={styles.collapsedStats}>
          <div className={styles.collapsedStat} title="85% Average Score">
            📊
          </div>
          <div className={styles.collapsedStat} title="12 Badges">
            🏆
          </div>
          <div className={styles.collapsedStat} title="7 Day Streak">
            🔥
          </div>
        </div>
      )}
    </div>
  );
}
