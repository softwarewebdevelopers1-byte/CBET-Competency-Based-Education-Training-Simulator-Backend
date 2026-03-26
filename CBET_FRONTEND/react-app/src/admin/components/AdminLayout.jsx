// components/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import styles from "../styles/AdminLayout.module.css";

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

const getStoredTheme = () => {
  const savedTheme = localStorage.getItem("cbet_theme");
  return savedTheme === "dark" ? "dark" : "light";
};

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [themeMode, setThemeMode] = useState(getStoredTheme);
  const navigate = useNavigate();
  const mainContentClassName = [
    styles.mainContent,
    !isMobile && sidebarCollapsed ? styles.desktopCollapsed : "",
    !isMobile && !sidebarCollapsed ? styles.desktopExpanded : "",
    !sidebarCollapsed && isMobile ? styles.sidebarOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Check screen size on resize
  useEffect(() => {
    const checkAuth = async () => {
      const localData = readStoredUser();
      const res = await fetch("http://localhost:8000/auth/user/check/logged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const userData = await res.json();

      if (!res.ok || userData.role !== "admin") {
        clearStoredAuthData();
        navigate("/login");
      }
    };

    checkAuth();

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // On desktop, expand sidebar by default
      if (!mobile) {
        setSidebarCollapsed(false);
      } else {
        setSidebarCollapsed(true);
      }
    };

    handleResize(); // Call on mount
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    localStorage.setItem("cbet_theme", themeMode);
  }, [themeMode]);

  // Handle body scroll when sidebar opens on mobile
  useEffect(() => {
    if (!sidebarCollapsed && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarCollapsed, isMobile]);

  return (
    <div className={styles.adminLayout}>
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className={mainContentClassName}>
        <Header
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          themeMode={themeMode}
          onToggleTheme={() =>
            setThemeMode((currentTheme) =>
              currentTheme === "dark" ? "light" : "dark",
            )
          }
        />
        <div className={styles.contentWrapper}>
          <div className={styles.pageSurface}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
