import React, { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { useNavigate } from "react-router-dom";

export function Dashboard({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  let location = useNavigate();
  useEffect(() => {
    async function checkAuth() {
      let res = await fetch("http://localhost:8000/auth/user/check/logged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: JSON.parse(localStorage.getItem("cbet_user")),
        }),
        credentials: "include",
      });
      if (!res.ok) {
        location("/login");
      }
      if (res.ok) {
        location("/dashboard");
      }
    }
    checkAuth();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div
        className="dashboard-content"
        style={{
          marginLeft: collapsed ? "80px" : "280px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}
