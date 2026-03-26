// pages/Dashboard.jsx
import React from "react";
import {
  Users,
  Gamepad2,
  BookOpen,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react";
import styles from "../styles/dashboard.module.css";

const AdminDashboard = () => {
  const stats = [
    {
      icon: Users,
      label: "Total Users",
      value: "2,543",
      change: "+12%",
      color: "blue",
    },
    {
      icon: Gamepad2,
      label: "Active Simulations",
      value: "156",
      change: "+5%",
      color: "green",
    },
    {
      icon: BookOpen,
      label: "Learning Materials",
      value: "892",
      change: "+23%",
      color: "purple",
    },
    {
      icon: Award,
      label: "Certificates Issued",
      value: "431",
      change: "+18%",
      color: "orange",
    },
  ];

  const recentActivities = [
    {
      user: "John Doe",
      action: "Completed Simulation",
      time: "5 minutes ago",
      type: "simulation",
    },
    {
      user: "Jane Smith",
      action: "Uploaded Portfolio",
      time: "15 minutes ago",
      type: "portfolio",
    },
    {
      user: "Mike Johnson",
      action: "Passed Assessment",
      time: "1 hour ago",
      type: "assessment",
    },
    {
      user: "Sarah Wilson",
      action: "Earned Badge",
      time: "2 hours ago",
      type: "gamification",
    },
  ];

  const handleQuickAction = (action) => {
    console.log(`Quick action: ${action}`);
    // Add navigation or modal logic here
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <h1>Dashboard</h1>
        <div className={styles.dateRange}>
          <select defaultValue="today">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${styles.statCard} ${styles[stat.color]}`}
          >
            <div className={styles.statIcon}>
              <stat.icon size={24} />
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statChange}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.chartCard}>
          <h3>User Activity</h3>
          <div className={styles.chartPlaceholder}>
            <div className={styles.placeholderContent}>
              <TrendingUp size={48} />
              <p>Activity chart visualization</p>
            </div>
          </div>
        </div>

        <div className={styles.recentActivities}>
          <h3>Recent Activities</h3>
          <div className={styles.activityList}>
            {recentActivities.map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <div
                  className={`${styles.activityIcon} ${styles[activity.type]}`}
                >
                  <Clock size={16} />
                </div>
                <div className={styles.activityDetails}>
                  <p>
                    <strong>{activity.user}</strong> {activity.action}
                  </p>
                  <span className={styles.activityTime}>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionButtons}>
          <button
            className={styles.actionBtn}
            onClick={() => handleQuickAction("Create Simulation")}
          >
            Create Simulation
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => handleQuickAction("Upload Materials")}
          >
            Upload Materials
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => handleQuickAction("Generate Assessment")}
          >
            Generate Assessment
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => handleQuickAction("Review Portfolios")}
          >
            Review Portfolios
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
