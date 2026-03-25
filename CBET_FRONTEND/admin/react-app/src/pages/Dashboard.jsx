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

const Dashboard = () => {
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

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="date-range">
          <select defaultValue="today">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-change">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <h3>User Activity</h3>
          <div className="chart-placeholder">
            {/* Chart component would go here */}
            <div className="placeholder-content">
              <TrendingUp size={48} />
              <p>Activity chart visualization</p>
            </div>
          </div>
        </div>

        <div className="recent-activities">
          <h3>Recent Activities</h3>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  <Clock size={16} />
                </div>
                <div className="activity-details">
                  <p>
                    <strong>{activity.user}</strong> {activity.action}
                  </p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">Create Simulation</button>
          <button className="action-btn">Upload Materials</button>
          <button className="action-btn">Generate Assessment</button>
          <button className="action-btn">Review Portfolios</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
