// components/Header.jsx
import React, { useEffect, useState } from "react";
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import styles from "../styles/header.module.css";

const clearStoredAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("cbet_user");
  localStorage.removeItem("admin_user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("cbet_user");
  sessionStorage.removeItem("admin_user");
};

const Header = ({
  onMenuClick,
  sidebarCollapsed,
  isMobile,
  themeMode,
  onToggleTheme,
  roleLabel = "Administrator",
  searchPlaceholder = "Search courses, users, assessments...",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [adminName, setAdminName] = useState("Admin User");
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New user registered", read: false },
    { id: 2, message: "Course enrollment completed", read: false },
    { id: 3, message: "Assessment ready for review", read: false },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const response = await fetch(
          "https://cbet-competency-based-education-training.onrender.com/auth/user/check/logged",
          {
            method: "POST",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (response.ok && data?.fullName) {
          setAdminName(data.fullName);
        }
      } catch (error) {
        console.error("Unable to load admin profile:", error);
      }
    };

    loadAdminProfile();
  }, []);

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

  const handleNotificationClick = () => {
    // Mark all as read or open notifications panel
    console.log("Open notifications");
  };

  return (
    <header className={styles.adminHeader}>
      {/* Mobile Menu Button (Optional) */}
      {isMobile && (
        <button className={styles.menuButton} onClick={onMenuClick}>
          {sidebarCollapsed ? "☰" : "✕"}
        </button>
      )}

      <div className={styles.headerSearch}>
        <Search className={styles.searchIcon} size={20} />
        <input
          type="text"
          placeholder={searchPlaceholder}
        />
      </div>

      <div className={styles.headerActions}>
        <button
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
          type="button"
        >
          {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className={styles.notificationBtn}
          onClick={handleNotificationClick}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </button>

        <div
          className={styles.userProfile}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className={styles.userAvatar}>
            <User size={20} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{adminName}</span>
            <span className={styles.userRole}>{roleLabel}</span>
          </div>
          <ChevronDown size={16} className={styles.dropdownIcon} />
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className={styles.userDropdown}>
            <div className={styles.userDropdownItem}>
              <User size={16} />
              <span>Profile</span>
            </div>
            <div className={styles.userDropdownItem}>
              <Settings size={16} />
              <span>Settings</span>
            </div>
            <div className={styles.divider} />
            <div
              className={`${styles.userDropdownItem} ${styles.danger}`}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
