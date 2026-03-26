import React, { createContext, useEffect, useState } from "react";
import { Sidebar } from "./sidebar.jsx";
import { useNavigate } from "react-router-dom";
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
  const [themeMode, setThemeMode] = useState(getStoredTheme);
  let location = useNavigate();
  useEffect(() => {
    async function checkAuth() {
      let localData = readStoredUser();
      let res = await fetch("http://localhost:8000/auth/user/check/logged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      let studentInfo = await res.json();

      if (!res.ok || !localData) {
        clearStoredAuthData();
        location("/login");
        return;
      }
      if (studentInfo.role === "student") {
        resetRole(studentInfo.role);
        location("/dashboard");
        const res = await fetch(
          "http://localhost:8000/auth/admin/upload/courses/my/courses",
          {
            method: "POST",
            credentials: "include",
          },
        );
        const data = await res.json();
        setCourses(data);
        return;
      }

      clearStoredAuthData();
      location("/login");
    }
    checkAuth();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    localStorage.setItem("cbet_theme", themeMode);
  }, [themeMode]);

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

      <div
        className="dashboard-content"
        style={{
          marginLeft: collapsed ? "80px" : "280px",
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
