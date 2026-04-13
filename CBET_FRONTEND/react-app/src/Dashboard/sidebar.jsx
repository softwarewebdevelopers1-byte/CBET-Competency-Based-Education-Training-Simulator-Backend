import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "../css/sidebar.module.css";
import {
  FiAward,
  FiBell,
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiFolder,
  FiHome,
  FiLogOut,
  FiMoon,
  FiSettings,
  FiSun,
  FiUser,
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
  themeMode,
  onToggleTheme,
  studentData = {},
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    typeof collapsedProp === "boolean" ? collapsedProp : internalCollapsed;
  const navigate = useNavigate();
  const userInfo = readStoredUser();

  useEffect(() => {
    if (!userInfo) {
      clearStoredAuthData();
      navigate("/login");
    }
  }, [navigate, userInfo]);

  const profile = studentData.studentProfile || {};
  const stats = studentData.stats || {};
  const notifications = studentData.notifications || [];
  const pendingAssessments = studentData.upcomingAssessments || [];

  const student = useMemo(
    () => ({
      name: profile.fullName || userInfo?.user || "Student",
      program: profile.programme || userInfo?.programme || "CBET Programme",
      year: profile.yearOfStudy ? `Year ${profile.yearOfStudy}` : "Active learner",
      studentId: profile.userNumber || userInfo?.code || "N/A",
    }),
    [profile.fullName, profile.programme, profile.userNumber, profile.yearOfStudy, userInfo],
  );

  const updateItems = useMemo(() => {
    const notificationItems = notifications.map((item) => ({
      id: item.id,
      text: item.message,
    }));
    const assessmentItems = pendingAssessments.slice(0, 2).map((item) => ({
      id: `assessment-${item.id}`,
      text: `${item.title} - ${item.dueDate}`,
    }));

    return [...notificationItems, ...assessmentItems].slice(0, 3);
  }, [notifications, pendingAssessments]);

  if (!userInfo) {
    return null;
  }

  const handleLogout = async () => {
    await fetch("http://localhost:8000/auth/CBET/user/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }).catch(() => null);
    clearStoredAuthData();
    navigate("/login");
  };

  const toggleSidebar = () => {
    if (typeof onToggle === "function") {
      onToggle();
      return;
    }
    setInternalCollapsed((current) => !current);
  };

  const navItems = [
    { path: "/dashboard", icon: <FiHome />, label: "Dashboard" },
    { path: "/courses", icon: <FiBookOpen />, label: "My Courses" },
    { path: "/assessments", icon: <FiFileText />, label: "Assessments" },
    { path: "/portfolio", icon: <FiFolder />, label: "My Portfolio" },
    { path: "/achievements", icon: <FiAward />, label: "Achievements" },
  ];

  const averageScore = stats.averageScore || 0;
  const badgesEarned = stats.badgesEarned || 0;
  const streakDays = stats.streakDays || 0;

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.sidebarHeader}>
        {!collapsed ? (
          <div className={styles.logo}>
            <span className={styles.logoIcon}>CB</span>
            <span className={styles.logoText}>CBET Student</span>
          </div>
        ) : (
          <span className={styles.logoIconSmall}>CB</span>
        )}

        <button onClick={toggleSidebar} className={styles.toggleBtn} type="button">
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <div className={styles.studentInfo}>
        <div className={styles.studentAvatar}>
          {student.name.charAt(0).toUpperCase() || <FiUser />}
        </div>
        {!collapsed && (
          <div className={styles.studentDetails}>
            <p className={styles.studentName}>{student.name}</p>
            <p className={styles.studentProgram}>{student.program}</p>
            <p className={styles.studentId}>
              {student.year} • ID: {student.studentId}
            </p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className={styles.quickStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{averageScore}%</span>
            <span className={styles.statLabel}>Avg. Score</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{badgesEarned}</span>
            <span className={styles.statLabel}>Badges</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{streakDays}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
        </div>
      )}

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className={styles.notifications}>
          <div className={styles.notificationHeader}>
            <FiBell />
            <span>Updates</span>
            <span className={styles.notificationBadge}>{updateItems.length}</span>
          </div>
          <div className={styles.notificationList}>
            {updateItems.length > 0 ? (
              updateItems.map((item) => (
                <div key={item.id} className={styles.notificationItem}>
                  <span className={styles.notificationDot}></span>
                  <span className={styles.notificationText}>{item.text}</span>
                </div>
              ))
            ) : (
              <div className={styles.notificationItem}>
                <span className={styles.notificationDot}></span>
                <span className={styles.notificationText}>
                  New updates will appear here as your records change.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
        <button onClick={handleLogout} className={styles.logoutBtn} type="button">
          <FiLogOut />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {collapsed && (
        <div className={styles.collapsedStats}>
          <div
            className={styles.collapsedStat}
            title={`${averageScore}% Average Score`}
          >
            {averageScore}%
          </div>
          <div
            className={styles.collapsedStat}
            title={`${badgesEarned} Badges Earned`}
          >
            {badgesEarned}
          </div>
          <div
            className={styles.collapsedStat}
            title={`${streakDays} Completed Assessments`}
          >
            {streakDays}
          </div>
        </div>
      )}
    </div>
  );
}
