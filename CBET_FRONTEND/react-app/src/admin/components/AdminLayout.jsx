// components/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import styles from "../styles/AdminLayout.module.css";

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Handle sidebar toggle for mobile
  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div
      className={`${styles.adminLayout} ${mobileSidebarOpen ? styles.mobileSidebarOpen : ""}`}
    >
      <Sidebar
        collapsed={isMobile ? !mobileSidebarOpen : sidebarCollapsed}
        setCollapsed={handleSidebarToggle}
        isMobile={isMobile}
      />
      <div
        className={`${styles.mainContent} ${!isMobile && sidebarCollapsed ? styles.expanded : ""}`}
      >
        <Header
          onMenuClick={handleSidebarToggle}
          isMobile={isMobile}
          sidebarCollapsed={sidebarCollapsed}
        />
        <div className={styles.contentWrapper}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
