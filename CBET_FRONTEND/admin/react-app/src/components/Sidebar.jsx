// components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  BookOpen,
  FileText,
  FolderOpen,
  Trophy,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const menuItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/users", icon: Users, label: "User Management" },
    { path: "/admin/simulations", icon: Gamepad2, label: "Simulations" },
    { path: "/admin/materials", icon: BookOpen, label: "Learning Materials" },
    { path: "/admin/assessments", icon: FileText, label: "AI Assessments" },
    { path: "/admin/portfolio", icon: FolderOpen, label: "Portfolio Review" },
    { path: "/admin/gamification", icon: Trophy, label: "Gamification" },
    { path: "/admin/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo">
          {!collapsed && <span className="logo-text">CBET Simulator</span>}
          {collapsed && <span className="logo-icon">C</span>}
        </div>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon size={20} />
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn">
          <LogOut size={20} />
          {!collapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
