import React, { createContext, useEffect, useState } from "react";
import { Sidebar } from "./sidebar.jsx";
import { useNavigate } from "react-router-dom";
export let CourseContext = createContext();

export function Dashboard({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [role, resetRole] = useState("");
  const [courses, setCourses] = useState({});
  let location = useNavigate();
  useEffect(() => {
    async function checkAuth() {
      let res = await fetch("http://localhost:8000/auth/user/check/logged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      let studentInfo = await res.json();

      if (!res.ok) {
        location("/login");
      }
      if ((res.ok, studentInfo.role === "student")) {
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
      }
    }
    checkAuth();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar
        collapsed={collapsed}
        coursesInfo={courses}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <div
        className="dashboard-content"
        style={{
          marginLeft: collapsed ? "80px" : "280px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
        }}
      >
        <CourseContext value={courses}>{children}</CourseContext>
      </div>
    </div>
  );
}
