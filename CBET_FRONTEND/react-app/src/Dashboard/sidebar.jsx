// src/components/common/Sidebar.jsx

import React, { useState } from "react";
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
} from "react-icons/fi";

export function Sidebar({ collapsed: collapsedProp, onToggle, coursesInfo }) {
  console.log("course info", coursesInfo);

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    typeof collapsedProp === "boolean" ? collapsedProp : internalCollapsed;
  const navigate = useNavigate();

  // Mock student data - replace with actual user data from props or store
  const student = {
    name: JSON.parse(localStorage.getItem("cbet_user")).user || "User",
    program: "Diploma in ICT",
    year: "Year 2",
    studentId: "ICT-2024-001",
  };

  const handleLogout = async () => {
    let res = await fetch("http://localhost:8000/auth/CBET/user/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    localStorage.removeItem("cbet_user");
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
