import React, { createContext, useEffect, useState } from "react";
import { Sidebar } from "./sidebar.jsx";
import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../utils/apiClient.js";

export let CourseContext = createContext();

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

export function Dashboard({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [role, resetRole] = useState("");
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(false);
  const [themeMode, setThemeMode] = useState(getStoredTheme);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );
  let location = useNavigate();

  const checkAuth = async (ignoreCache = false) => {
    try {
      setLoading(true);
      let localData = readStoredUser();
      
      const studentInfo = await apiClient.getWithCache(
        "https://cbet-competency-based-education-training.onrender.com/auth/user/check/logged",
        { method: "POST" },
        ignoreCache ? 0 : 5 * 60 * 1000
      );

      if (!studentInfo || studentInfo.error || !localData) {
        clearStoredAuthData();
        location("/login");
        return;
      }

      if (studentInfo.role === "student") {
        resetRole(studentInfo.role);
        // location("/dashboard"); // Removed to prevent loop if already there

        const data = await apiClient.getWithCache(
          "https://cbet-competency-based-education-training.onrender.com/auth/admin/upload/courses/my/courses",
          { method: "POST" },
          ignoreCache ? 0 : 5 * 60 * 1000
        );
        
        setCourses(data);
      } else {
        clearStoredAuthData();
        location("/login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleManualRefresh = () => {
    apiClient.clearAllCache();
    checkAuth(true);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    localStorage.setItem("cbet_theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    const handleResize = () => {
      const mobileViewport = window.innerWidth <= 768;
      setIsMobile(mobileViewport);
      setCollapsed(mobileViewport);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="dashboard">
      <Sidebar
        collapsed={collapsed}
        coursesInfo={courses}
        onToggle={() => setCollapsed((c) => !c)}
        themeMode={themeMode}
        onToggleTheme={() =>
          setThemeMode((currentTheme) =>
            currentTheme === "dark" ? "light" : "dark",
          )
        }
      />

      <button
        onClick={handleManualRefresh}
        className="refresh-button"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 1000,
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
          transition: "all 0.2s ease",
          opacity: loading ? 0.7 : 1,
        }}
        title="Refresh data"
      >
        <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
      </button>

      <div
        className="dashboard-content"
        style={{
          marginLeft: isMobile ? "0" : collapsed ? "80px" : "280px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          background:
            themeMode === "dark"
              ? "linear-gradient(180deg, #020617 0%, #0f172a 100%)"
              : "#f8fafc",
        }}
      >
        <CourseContext value={courses}>{children}</CourseContext>
      </div>
    </div>
  );
}
