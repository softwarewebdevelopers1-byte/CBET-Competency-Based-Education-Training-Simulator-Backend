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
  RotateCcw,
} from "lucide-react";
import styles from "../styles/userManagement.module.css";

const INITIAL_FORM_STATE = {
  fullName: "",
  UserNumber: "",
  department: "",
  programme: "",
  yearOfStudy: "1",
  role: "student",
};

const INITIAL_EDIT_FORM_STATE = {
  fullName: "",
  UserNumber: "",
  department: "",
  programme: "",
  yearOfStudy: "1",
  role: "student",
  password: "",
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserForm, setNewUserForm] = useState(INITIAL_FORM_STATE);
  const [editUserForm, setEditUserForm] = useState(INITIAL_EDIT_FORM_STATE);
  const [selectedUserNumber, setSelectedUserNumber] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("https://cbet-competency-based-education-training.onrender.com/auth/admin/users", {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setSuccessMessage("");
    setError("");
    setNewUserForm(INITIAL_FORM_STATE);
    setIsCreateModalOpen(true);
  };

  const handleEditUser = (userId) => {
    const selectedUser = users.find((user) => user.UserNumber === userId);

    if (!selectedUser) {
      setError("Unable to load selected user");
      return;
    }

    setError("");
    setSuccessMessage("");
    setSelectedUserNumber(userId);
    setEditUserForm({
      fullName: selectedUser.fullName || "",
      UserNumber: selectedUser.UserNumber || "",
      department: selectedUser.department || "",
      programme: selectedUser.programme || "",
      yearOfStudy: String(selectedUser.yearOfStudy || 1),
      role: selectedUser.role || "student",
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm(
      "Suspend this account now? It will be deleted automatically after 7 days.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "https://cbet-competency-based-education-training.onrender.com/auth/admin/delete/user",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ UserNumber: userId }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to suspend user");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.UserNumber === userId
            ? {
                ...user,
                status: data.user?.status || "suspended",
                account_state: data.user?.account_state || "suspended",
                expiresAt: data.user?.expiresAt,
              }
            : user,
        ),
      );

      setSuccessMessage(
        "User suspended successfully. The record will be deleted after 7 days.",
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to suspend user",
      );
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "https://cbet-competency-based-education-training.onrender.com/auth/recover/account",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ UserNumber: userId }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to restore user");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.UserNumber === userId
            ? {
                ...user,
                status: data.user?.status || "active",
                account_state: data.user?.account_state || "approved",
                expiresAt: null,
              }
            : user,
        ),
      );

      setSuccessMessage("User account restored successfully.");
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore user",
      );
    }
  };

  const handleCreateInputChange = (event) => {
    const { name, value } = event.target;

    setNewUserForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;

    setEditUserForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("https://cbet-competency-based-education-training.onrender.com/auth/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUserForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create user");
      }

      setSuccessMessage(
        `User created successfully. Default password: ${data.defaultPassword}`,
      );
      setIsCreateModalOpen(false);
      setNewUserForm(INITIAL_FORM_STATE);
      await fetchUsers();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create user",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");
      const encodedUserNumber = encodeURIComponent(selectedUserNumber);

      const response = await fetch(
        `https://cbet-competency-based-education-training.onrender.com/auth/admin/users/${encodedUserNumber}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editUserForm),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update user");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.UserNumber === selectedUserNumber ? data.user : user,
        ),
      );
      setIsEditModalOpen(false);
      setSelectedUserNumber("");
      setEditUserForm(INITIAL_EDIT_FORM_STATE);
      setSuccessMessage(
        data.passwordUpdated
          ? "User updated successfully. Password was re-hashed."
          : "User details updated successfully.",
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update user",
      );
    } finally {
      setIsSubmitting(false);
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
            <option value="suspended">Suspended</option>
          </select>

          <button className={styles.filterBtn}>
            <Filter size={20} />
            Total: {filteredUsers.length}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successBanner}>{successMessage}</div>
      )}
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
                        data-tooltip="Suspend user"
                      >
                        <Trash2 size={16} />
                      </button>
                      {user.status?.toLowerCase() === "suspended" && (
                        <button
                          className={`${styles.iconBtn} ${styles.restore}`}
                          onClick={() => handleRestoreUser(user.UserNumber)}
                          data-tooltip="Restore user"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
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

      {isCreateModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create User</h2>
              <p>
                Students get <strong>student123</strong>. Staff accounts
                (`admin` and `trainer`) get <strong>staff123</strong>.
              </p>
            </div>

            <form className={styles.createUserForm} onSubmit={handleCreateUser}>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>Full Name</span>
                  <input
                    name="fullName"
                    value={newUserForm.fullName}
                    onChange={handleCreateInputChange}
                    required
                  />
                </label>

                <label className={styles.formField}>
                  <span>User Number</span>
                  <input
                    name="UserNumber"
                    value={newUserForm.UserNumber}
                    onChange={handleCreateInputChange}
                    required
                  />
                </label>   

                <label className={styles.formField}>
                  <span>Role</span>
                  <select
                    name="role"
                    value={newUserForm.role}
                    onChange={handleCreateInputChange}
                  >
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className={styles.formField}>
                  <span>Year of Study</span>
                  <input
                    name="yearOfStudy"
                    type="number"
                    min="1"
                    value={newUserForm.yearOfStudy}
                    onChange={handleCreateInputChange}
                    disabled={newUserForm.role !== "student"}
                  />
                </label>

                <label className={styles.formField}>
                  <span>Department</span>
                  <input
                    name="department"
                    value={newUserForm.department}
                    onChange={handleCreateInputChange}
                  />
                </label>

                <label className={styles.formField}>
                  <span>Programme</span>
                  <input
                    name="programme"
                    value={newUserForm.programme}
                    onChange={handleCreateInputChange}
                  />
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit User</h2>
              <p>
                Update the selected user details. Leave password empty to keep
                the current hashed password unchanged.
              </p>
            </div>

            <form className={styles.createUserForm} onSubmit={handleUpdateUser}>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>Full Name</span>
                  <input
                    name="fullName"
                    value={editUserForm.fullName}
                    onChange={handleEditInputChange}
                    required
                  />
                </label>

                <label className={styles.formField}>
                  <span>User Number</span>
                  <input
                    name="UserNumber"
                    value={editUserForm.UserNumber}
                    onChange={handleEditInputChange}
                    required
                  />
                </label>

                <label className={styles.formField}>
                  <span>Role</span>
                  <select
                    name="role"
                    value={editUserForm.role}
                    onChange={handleEditInputChange}
                  >
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className={styles.formField}>
                  <span>Year of Study</span>
                  <input
                    name="yearOfStudy"
                    type="number"
                    min="1"
                    value={editUserForm.yearOfStudy}
                    onChange={handleEditInputChange}
                    disabled={editUserForm.role !== "student"}
                  />
                </label>

                <label className={styles.formField}>
                  <span>Department</span>
                  <input
                    name="department"
                    value={editUserForm.department}
                    onChange={handleEditInputChange}
                  />
                </label>

                <label className={styles.formField}>
                  <span>Programme</span>
                  <input
                    name="programme"
                    value={editUserForm.programme}
                    onChange={handleEditInputChange}
                  />
                </label>

                <label className={`${styles.formField} ${styles.fullWidthField}`}>
                  <span>New Password</span>
                  <input
                    name="password"
                    type="password"
                    value={editUserForm.password}
                    onChange={handleEditInputChange}
                    placeholder="Leave empty to keep existing password"
                  />
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
