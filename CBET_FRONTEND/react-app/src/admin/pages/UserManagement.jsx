// pages/UserManagement.jsx
import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";

const UserManagement = () => {
  const [users] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Student",
      status: "Active",
      lastActive: "2 mins ago",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Trainer",
      status: "Active",
      lastActive: "1 hour ago",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "Student",
      status: "Inactive",
      lastActive: "2 days ago",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah@example.com",
      role: "Student",
      status: "Active",
      lastActive: "5 mins ago",
    },
    {
      id: 5,
      name: "Robert Brown",
      email: "robert@example.com",
      role: "Trainer",
      status: "Active",
      lastActive: "30 mins ago",
    },
  ]);

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="primary-btn">
          <Plus size={20} />
          Add New User
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input type="text" placeholder="Search users..." />
        </div>

        <div className="filter-options">
          <select defaultValue="all">
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Administrators</option>
          </select>

          <select defaultValue="all">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button className="filter-btn">
            <Filter size={20} />
            More Filters
          </button>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{user.name.charAt(0)}</div>
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.lastActive}</td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-btn edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn delete">
                      <Trash2 size={16} />
                    </button>
                    <button className="icon-btn more">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
