import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "../../admin/components/Header.jsx";
import styles from "../../admin/styles/AdminLayout.module.css";

const clearStoredAuthData = () => {
  localStorage.removeItem("cbet_user");
  localStorage.removeItem("token");
  localStorage.removeItem("admin_user");
  sessionStorage.removeItem("cbet_user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("admin_user");
};

const getStoredTheme = () => {
  const savedTheme = localStorage.getItem("cbet_theme");
  return savedTheme === "dark" ? "dark" : "light";
};

const TrainerLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
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

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("https://cbet-competency-based-education-training.onrender.com/auth/user/check/logged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const userData = await res.json();

      if (!res.ok || userData.role !== "trainer") {
        clearStoredAuthData();
        navigate("/login");
      }
    };

    checkAuth();

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarCollapsed(mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    localStorage.setItem("cbet_theme", themeMode);
  }, [themeMode]);

  return (
    <div className={styles.adminLayout}>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
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
          roleLabel="Trainer"
          searchPlaceholder="Search your assessments and scenarios..."
        />
        <div className={styles.contentWrapper}>
          <div className={styles.pageSurface}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default TrainerLayout;
