// components/Header.jsx
import React from "react";
import { Bell, Search, User } from "lucide-react";

const Header = () => {
  return (
    <header className="admin-header">
      <div className="header-search">
        <Search size={20} className="search-icon" />
        <input type="text" placeholder="Search..." />
      </div>

      <div className="header-actions">
        <button className="notification-btn">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>

        <div className="user-profile">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
