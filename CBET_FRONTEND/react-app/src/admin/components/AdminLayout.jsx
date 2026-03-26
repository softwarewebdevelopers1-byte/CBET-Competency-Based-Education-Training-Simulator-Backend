// components/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import styles from "../styles/AdminLayout.module.css";

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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
    (async () => {
      let res = await fetch("http://localhost:8000/auth/user/check/logged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      console.log(await res.json());

      if (!res.ok) {
        navigate("/login");
      }
      if (res.ok) {
        navigate("/dashboard/admin");
      }
    })();
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
        />
        <div className={styles.contentWrapper}>
          <div className={styles.pageSurface}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
