// pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import styles from "../styles/dashboard.module.css";
import {
  getDashboardCacheKey,
  readDashboardCache,
  removeDashboardCache,
  writeDashboardCache,
} from "../../utils/browserCache";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://cbet-competency-based-education-training.onrender.com";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [promotingYears, setPromotingYears] = useState(false);
  const cacheKey = getDashboardCacheKey("admin", "dashboard", "users");

  const fetchUsers = async () => {
    try {
      const cachedUsers = readDashboardCache(cacheKey);
      if (cachedUsers) {
        setUsers(Array.isArray(cachedUsers) ? cachedUsers : []);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/auth/admin/users`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to fetch dashboard data");
      }

      const nextUsers = Array.isArray(data.users) ? data.users : [];
      setUsers(nextUsers);
      writeDashboardCache(cacheKey, nextUsers);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to fetch dashboard data",
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePromoteAcademicYear = async () => {
    const confirmed = window.confirm(
      "Advance all student academic years now? Fourth-year students will be marked as graduated.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setPromotingYears(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_BASE_URL}/auth/admin/users/promote-academic-year`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update academic years");
      }

      setSuccessMessage(
        `Academic year updated. Promoted ${data.promotedCount || 0} students and graduated ${data.graduatedCount || 0}.`,
      );
      removeDashboardCache(cacheKey);
      await fetchUsers();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update academic years",
      );
    } finally {
      setPromotingYears(false);
    }
  };

  const analytics = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (user) => user.status?.toLowerCase() === "active",
    ).length;
    const suspendedUsers = users.filter(
      (user) => user.status?.toLowerCase() === "suspended",
    ).length;
    const adminUsers = users.filter(
      (user) => user.role?.toLowerCase() === "admin",
    ).length;
    const trainerUsers = users.filter(
      (user) => user.role?.toLowerCase() === "trainer",
    ).length;
    const studentUsers = users.filter(
      (user) => user.role?.toLowerCase() === "student",
    ).length;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      trainerUsers,
      studentUsers,
      staffUsers: adminUsers + trainerUsers,
    };
  }, [users]);

  const stats = [
    {
      icon: Users,
      label: "Total Users",
      value: analytics.totalUsers,
      helper: "Accounts in the database",
      color: "blue",
    },
    {
      icon: UserCheck,
      label: "Active Users",
      value: analytics.activeUsers,
      helper: "Approved and usable accounts",
      color: "green",
    },
    {
      icon: UserX,
      label: "Suspended Users",
      value: analytics.suspendedUsers,
      helper: "Will auto-delete after 7 days",
      color: "red",
    },
    {
      icon: Briefcase,
      label: "Staff Accounts",
      value: analytics.staffUsers,
      helper: "Admin and trainer accounts",
      color: "purple",
    },
  ];

  const roleBreakdown = [
    {
      label: "Students",
      value: analytics.studentUsers,
      icon: GraduationCap,
      tone: "student",
    },
    {
      label: "Trainers",
      value: analytics.trainerUsers,
      icon: Briefcase,
      tone: "trainer",
    },
    {
      label: "Admins",
      value: analytics.adminUsers,
      icon: ShieldCheck,
      tone: "admin",
    },
  ];

  const visibleUsers = users.slice(0, 6);

  return (
    <div className={`${styles.dashboard} ${loading ? styles.loading : ""}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Live overview of user accounts currently stored in the database.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {successMessage && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem 1.1rem",
            borderRadius: "0.9rem",
            background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
            border: "1px solid rgba(34, 197, 94, 0.65)",
            color: "#166534",
            fontSize: "0.92rem",
            fontWeight: 700,
          }}
        >
          {successMessage}
        </div>
      )}

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={`${styles.statCard} ${styles[stat.color]}`}>
            <div className={styles.statIcon}>
              <stat.icon size={22} />
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statHelper}>{stat.helper}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.dataCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3>Users In Database</h3>
              <p>Actual records fetched from the backend user collection.</p>
            </div>
            <button
              className={styles.inlineAction}
              onClick={() => navigate("/admin/users")}
            >
              Manage Users
              <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className={styles.placeholderBox}>Loading users...</div>
          ) : visibleUsers.length === 0 ? (
            <div className={styles.placeholderBox}>No users available.</div>
          ) : (
            <div className={styles.userList}>
              {visibleUsers.map((user) => (
                <div key={user.UserNumber} className={styles.userListItem}>
                  <div className={styles.userAvatar}>
                    {(user.fullName || user.UserNumber || "U").charAt(0)}
                  </div>
                  <div className={styles.userListContent}>
                    <span className={styles.userListName}>
                      {user.fullName || "Unnamed User"}
                    </span>
                    <span className={styles.userListMeta}>
                      {user.UserNumber} | {user.department || "No department"}
                    </span>
                  </div>
                  <span
                    className={`${styles.rolePill} ${styles[(user.role || "").toLowerCase()]}`}
                  >
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.dataCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3>Role Breakdown</h3>
              <p>How accounts are distributed by user role.</p>
            </div>
          </div>

          <div className={styles.breakdownList}>
            {roleBreakdown.map((entry) => (
              <div key={entry.label} className={styles.breakdownItem}>
                <div className={`${styles.breakdownIcon} ${styles[entry.tone]}`}>
                  <entry.icon size={18} />
                </div>
                <div className={styles.breakdownContent}>
                  <span>{entry.label}</span>
                  <strong>{entry.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionButtons}>
          <button
            className={styles.actionBtn}
            onClick={() => navigate("/admin/users")}
          >
            Add or Manage Users
          </button>
          <button
            className={styles.actionBtn}
            onClick={handlePromoteAcademicYear}
            disabled={promotingYears}
          >
            {promotingYears ? "Updating Years..." : "Advance Academic Year"}
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => navigate("/admin/simulations")}
          >
            Manage Simulations
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
