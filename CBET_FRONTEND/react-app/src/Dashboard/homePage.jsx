// src/components/home/Homepage.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/homepage.module.css";
import {
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiAward,
  FiCalendar,
  FiPlayCircle,
  FiFileText,
  FiVideo,
  FiUsers,
  FiStar,
  FiBarChart2,
  FiChevronRight,
  FiBell,
} from "react-icons/fi";

export function Homepage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();

  // Mock user data - replace with actual user data
  const user = {
    name: JSON.parse(localStorage.getItem("cbet_user")).user || "User",
    role: "student", // or "trainer", "admin"
    institution: " TVET Institute",
    avatar: "JD",
    points: 1250,
    streak: 7,
    badges: 12,
    rank: "Gold Learner",
  };

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        coursesInProgress: 4,
        completedCourses: 8,
        pendingAssessments: 2,
        averageScore: 85,
        totalPoints: 1250,
        currentRank: "Gold",
        streakDays: 7,
        badgesEarned: 12,
      });

      setRecentActivities([
        {
          id: 1,
          type: "course",
          title: "Completed Web Development Module 3",
          time: "2 hours ago",
          icon: <FiCheckCircle />,
          color: "#10b981",
        },
        {
          id: 2,
          type: "assessment",
          title: "Scored 92% on JavaScript Assessment",
          time: "Yesterday",
          icon: <FiStar />,
          color: "#f59e0b",
        },
        {
          id: 3,
          type: "badge",
          title: "Earned 'Fast Learner' Badge",
          time: "2 days ago",
          icon: <FiAward />,
          color: "#8b5cf6",
        },
        {
          id: 4,
          type: "scenario",
          title: "Completed Ethical Dilemma Scenario",
          time: "3 days ago",
          icon: <FiPlayCircle />,
          color: "#3b82f6",
        },
      ]);

      setUpcomingDeadlines([
        {
          id: 1,
          title: "Network Security Quiz",
          course: "ICT 304",
          dueDate: "Tomorrow, 5:00 PM",
          type: "assessment",
          priority: "high",
        },
        {
          id: 2,
          title: "Portfolio Submission",
          course: "Web Development",
          dueDate: "Dec 15, 2026",
          type: "portfolio",
          priority: "medium",
        },
        {
          id: 3,
          title: "Group Project Presentation",
          course: "Software Engineering",
          dueDate: "Dec 18, 2026",
          type: "project",
          priority: "low",
        },
      ]);

      setRecommendedCourses([
        {
          id: 1,
          title: "Advanced JavaScript",
          instructor: "Dr. Sarah Kimani",
          progress: 0,
          image: "📘",
          students: 234,
        },
        {
          id: 2,
          title: "Network Security Fundamentals",
          instructor: "Prof. John Omondi",
          progress: 0,
          image: "🔒",
          students: 156,
        },
        {
          id: 3,
          title: "Database Management",
          instructor: "Eng. Mary Wanjiku",
          progress: 0,
          image: "🗄️",
          students: 189,
        },
      ]);

      setNotifications([
        {
          id: 1,
          message: "New course material added: JavaScript Basics",
          time: "1 hour ago",
          read: false,
        },
        {
          id: 2,
          message: "Your assessment has been graded",
          time: "3 hours ago",
          read: false,
        },
        {
          id: 3,
          message: "Reminder: Network Security Quiz tomorrow",
          time: "5 hours ago",
          read: true,
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
        return styles.priorityHigh;
      case "medium":
        return styles.priorityMedium;
      case "low":
        return styles.priorityLow;
      default:
        return "";
    }
  };

  return (
    <div className={styles.homepage}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeHeader}>
          <div>
            <h1 className={styles.welcomeTitle}>
              Welcome back, {user.name}! 👋
            </h1>
            <p className={styles.welcomeSubtitle}>
              {user.institution} •{" "}
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
            </p>
          </div>
          <div className={styles.notificationBadge}>
            <FiBell className={styles.notificationIcon} />
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className={styles.notificationCount}>
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#e8f0fe", color: "#4f46e5" }}
          >
            <FiBookOpen />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.coursesInProgress}</span>
            <span className={styles.statLabel}>Courses in Progress</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#d1fae5", color: "#10b981" }}
          >
            <FiCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.completedCourses}</span>
            <span className={styles.statLabel}>Completed Courses</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fef3c7", color: "#f59e0b" }}
          >
            <FiFileText />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.pendingAssessments}</span>
            <span className={styles.statLabel}>Pending Assessments</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fae8ff", color: "#8b5cf6" }}
          >
            <FiTrendingUp />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.averageScore}%</span>
            <span className={styles.statLabel}>Average Score</span>
          </div>
        </div>
      </div>

      {/* Gamification Strip */}
      <div className={styles.gamificationStrip}>
        <div className={styles.gamificationItem}>
          <FiAward className={styles.gamificationIcon} />
          <div>
            <span className={styles.gamificationLabel}>Total Points</span>
            <span className={styles.gamificationValue}>
              {stats.totalPoints}
            </span>
          </div>
        </div>
        <div className={styles.gamificationDivider}></div>
        <div className={styles.gamificationItem}>
          <FiStar className={styles.gamificationIcon} />
          <div>
            <span className={styles.gamificationLabel}>Current Rank</span>
            <span className={styles.gamificationValue}>
              {stats.currentRank}
            </span>
          </div>
        </div>
        <div className={styles.gamificationDivider}></div>
        <div className={styles.gamificationItem}>
          <FiClock className={styles.gamificationIcon} />
          <div>
            <span className={styles.gamificationLabel}>Streak Days</span>
            <span className={styles.gamificationValue}>
              {stats.streakDays} 🔥
            </span>
          </div>
        </div>
        <div className={styles.gamificationDivider}></div>
        <div className={styles.gamificationItem}>
          <FiAward className={styles.gamificationIcon} />
          <div>
            <span className={styles.gamificationLabel}>Badges Earned</span>
            <span className={styles.gamificationValue}>
              {stats.badgesEarned}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Recent Activity */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
              <Link to="/activities" className={styles.viewAllLink}>
                View All <FiChevronRight />
              </Link>
            </div>
            <div className={styles.activityList}>
              {recentActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div
                    className={styles.activityIcon}
                    style={{
                      background: activity.color + "20",
                      color: activity.color,
                    }}
                  >
                    {activity.icon}
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityTitle}>{activity.title}</p>
                    <span className={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Courses */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recommended for You</h2>
              <Link to="/courses" className={styles.viewAllLink}>
                Browse All <FiChevronRight />
              </Link>
            </div>
            <div className={styles.courseList}>
              {recommendedCourses.map((course) => (
                <div key={course.id} className={styles.courseItem}>
                  <div className={styles.courseImage}>{course.image}</div>
                  <div className={styles.courseInfo}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    <p className={styles.courseInstructor}>
                      {course.instructor}
                    </p>
                    <div className={styles.courseMeta}>
                      <span className={styles.courseStudents}>
                        <FiUsers /> {course.students} students
                      </span>
                      <button
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className={styles.enrollButton}
                      >
                        Enroll
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Upcoming Deadlines */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FiCalendar /> Upcoming Deadlines
              </h2>
            </div>
            <div className={styles.deadlineList}>
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className={styles.deadlineItem}>
                  <div
                    className={`${styles.deadlinePriority} ${getPriorityClass(deadline.priority)}`}
                  ></div>
                  <div className={styles.deadlineContent}>
                    <h3 className={styles.deadlineTitle}>{deadline.title}</h3>
                    <p className={styles.deadlineCourse}>{deadline.course}</p>
                    <span className={styles.deadlineDate}>
                      <FiClock /> {deadline.dueDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.viewCalendarBtn}>View Calendar</button>
          </div>

          {/* Progress Overview */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FiBarChart2 /> Progress Overview
              </h2>
            </div>
            <div className={styles.progressList}>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>Web Development</span>
                  <span>75%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>Network Security</span>
                  <span>45%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>Database Design</span>
                  <span>90%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: "90%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button
              className={styles.quickActionBtn}
              onClick={() => navigate("/scenarios")}
            >
              <FiPlayCircle /> Start Scenario
            </button>
            <button
              className={styles.quickActionBtn}
              onClick={() => navigate("/assessments")}
            >
              <FiFileText /> Take Assessment
            </button>
            <button
              className={styles.quickActionBtn}
              onClick={() => navigate("/portfolio")}
            >
              <FiBookOpen /> View Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
