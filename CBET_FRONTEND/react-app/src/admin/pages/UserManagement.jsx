// pages/UserManagement.jsx
import React, { useEffect, useState } from "react";
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
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:8000/auth/find/users", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to fetch users");
        }

        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to fetch users",
        );
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.UserNumber !== userId),
      );
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.UserNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.programme?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "all" || user.role?.toLowerCase() === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status?.toLowerCase() === statusFilter;

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
            placeholder="Search by name, user number, department, or programme..."
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
            Total: {filteredUsers.length}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.usersTableContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={64} />
            <p>{error ? "Unable to load users" : "No users found"}</p>
          </div>
        ) : (
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>User Number</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Programme</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.UserNumber}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {(user.fullName || user.UserNumber || "U").charAt(0)}
                      </div>
                      <div>
                        <div className={styles.userName}>
                          {user.fullName || "Unnamed User"}
                        </div>
                        <div className={styles.userMeta}>
                          Year {user.yearOfStudy || 1} |{" "}
                          {user.account_state || "active"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{user.UserNumber}</td>
                  <td>{user.department || "Not set"}</td>
                  <td>
                    <span
                      className={`${styles.roleBadge} ${styles[(user.role || "").toLowerCase()]}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[(user.status || "").toLowerCase()]}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>{user.programme || "Not set"}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.iconBtn} ${styles.edit}`}
                        onClick={() => handleEditUser(user.UserNumber)}
                        data-tooltip="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.delete}`}
                        onClick={() => handleDeleteUser(user.UserNumber)}
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
