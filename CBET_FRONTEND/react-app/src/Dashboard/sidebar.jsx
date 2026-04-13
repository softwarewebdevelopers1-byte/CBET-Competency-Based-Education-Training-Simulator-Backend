import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "../css/sidebar.module.css";
import {
  FiAward,
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
  FiTarget,
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

const getCourseStats = (coursesInfo) => {
  const totalCourses = Array.isArray(coursesInfo?.count) && coursesInfo.count.length > 0
    ? coursesInfo.count[0]?.count || 0
    : Array.isArray(coursesInfo?.courses)
      ? coursesInfo.courses.length
      : 0;

  const completedCourses =
    Array.isArray(coursesInfo?.completedCourses) &&
    coursesInfo.completedCourses.length > 0
      ? coursesInfo.completedCourses[0]?.count || 0
      : 0;

  const activeCourses = Math.max(totalCourses - completedCourses, 0);

  return { totalCourses, completedCourses, activeCourses };
};

export function Sidebar({
  collapsed: collapsedProp,
  onToggle,
  coursesInfo,
  themeMode,
  onToggleTheme,
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    typeof collapsedProp === "boolean" ? collapsedProp : internalCollapsed;
  const navigate = useNavigate();
  const userInfo = readStoredUser();
  const { totalCourses, completedCourses, activeCourses } = useMemo(
    () => getCourseStats(coursesInfo),
    [coursesInfo],
  );

  useEffect(() => {
    if (!userInfo) {
      clearStoredAuthData();
      navigate("/login");
    }
  }, [navigate, userInfo]);

  if (!userInfo) {
    return null;
  }

  const student = {
    name: userInfo.user || "User",
    program: userInfo.programme || "Student Programme",
    year: userInfo.year || "Active learner",
    studentId: userInfo.code || "N/A",
  };

  const handleLogout = async () => {
    await fetch(
      "https://cbet-competency-based-education-training.onrender.com/auth/CBET/user/logout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    ).catch(() => null);
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

  const sidebarHighlights = [
    {
      label: "Active Courses",
      value: activeCourses,
      icon: <FiBookOpen />,
    },
    {
      label: "Completed",
      value: completedCourses,
      icon: <FiAward />,
    },
    {
      label: "Total Courses",
      value: totalCourses,
      icon: <FiTarget />,
    },
  ];

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
            <p className={styles.studentId}>ID: {student.studentId}</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className={styles.quickStats}>
          {sidebarHighlights.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <div className={styles.statDivider}></div>}
              <div className={styles.statItem}>
                <span className={styles.statValue}>{item.value}</span>
                <span className={styles.statLabel}>{item.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {!collapsed && (
        <div className={styles.notifications}>
          <div className={styles.notificationHeader}>
            <FiBookOpen />
            <span>Course Summary</span>
            <span className={styles.notificationBadge}>{totalCourses}</span>
          </div>
          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <span className={styles.notificationDot}></span>
              <span className={styles.notificationText}>
                {activeCourses} course{activeCourses === 1 ? "" : "s"} currently in progress
              </span>
            </div>
            <div className={styles.notificationItem}>
              <span className={styles.notificationDot}></span>
              <span className={styles.notificationText}>
                {completedCourses} course{completedCourses === 1 ? "" : "s"} completed
              </span>
            </div>
            <div className={styles.notificationItem}>
              <span className={styles.notificationDot}></span>
              <span className={styles.notificationText}>
                {totalCourses} total enrolled course{totalCourses === 1 ? "" : "s"}
              </span>
            </div>
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
            title={`${activeCourses} Active Courses`}
          >
            {activeCourses}
          </div>
          <div
            className={styles.collapsedStat}
            title={`${completedCourses} Completed Courses`}
          >
            {completedCourses}
          </div>
          <div
            className={styles.collapsedStat}
            title={`${totalCourses} Total Courses`}
          >
            {totalCourses}
          </div>
        </div>
      )}
    </div>
  );
}
