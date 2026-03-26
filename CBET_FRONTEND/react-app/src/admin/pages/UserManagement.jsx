// pages/UserManagement.jsx
import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Users,
} from "lucide-react";
import styles from "../styles/userManagement.module.css";

const UserManagement = () => {
  const [users, setUsers] = useState([
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

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const handleAddUser = () => {
    console.log("Add new user");
    // Implement add user modal/logic
  };

  const handleEditUser = (userId) => {
    console.log("Edit user:", userId);
    // Implement edit user logic
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((user) => user.id !== userId));
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "all" || user.role.toLowerCase() === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className={styles.userManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>User Management</h1>
          <p className={styles.pageDescription}>
            Manage learners, trainers, and administrators from one place.
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={handleAddUser}>
          <Plus size={20} />
          Add New User
        </button>
      </div>

      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className={styles.filterOptions}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button className={styles.filterBtn}>
            <Filter size={20} />
            More Filters
          </button>
        </div>
      </div>

      <div className={styles.usersTableContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={64} />
            <p>No users found</p>
          </div>
        ) : (
          <table className={styles.usersTable}>
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
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[user.status.toLowerCase()]}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>{user.lastActive}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.iconBtn} ${styles.edit}`}
                        onClick={() => handleEditUser(user.id)}
                        data-tooltip="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.delete}`}
                        onClick={() => handleDeleteUser(user.id)}
                        data-tooltip="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.more}`}
                        data-tooltip="More options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
