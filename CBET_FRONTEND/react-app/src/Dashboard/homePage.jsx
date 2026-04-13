import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/homepage.module.css";
import {
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiAward,
  FiCalendar,
  FiPlayCircle,
  FiFileText,
  FiUsers,
  FiStar,
  FiBarChart2,
  FiChevronRight,
  FiBell,
} from "react-icons/fi";
import { CourseContext } from "./dashboard";

const defaultRecommendedCourses = [
  {
    id: 1,
    title: "Advanced JavaScript",
    instructor: "Dr. Sarah Kimani",
    progress: 0,
    image: "JS",
    students: 234,
  },
  {
    id: 2,
    title: "Network Security Fundamentals",
    instructor: "Prof. John Omondi",
    progress: 0,
    image: "NS",
    students: 156,
  },
  {
    id: 3,
    title: "Database Management",
    instructor: "Eng. Mary Wanjiku",
    progress: 0,
    image: "DB",
    students: 189,
  },
];

export function Homepage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState(
    defaultRecommendedCourses,
  );
  const [notifications, setNotifications] = useState([]);
  const [simulationItems, setSimulationItems] = useState([]);

  const navigate = useNavigate();
  const coursesCount = useContext(CourseContext);

  const user = {
    name:
      JSON.parse(localStorage.getItem("cbet_user") || '{"user": "User"}')
        .user || "User",
    role: "student",
    institution: " TVET Institute",
  };

  const getCourseCount = () => {
    try {
      if (
        coursesCount &&
        coursesCount.count &&
        Array.isArray(coursesCount.count)
      ) {
        return coursesCount.count.length > 0 ? coursesCount.count[0].count : 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  };

  const getCompletedCourses = () => {
    try {
      if (
        coursesCount &&
        coursesCount.count &&
        Array.isArray(coursesCount.count)
      ) {
        return coursesCount.count.length > 0
          ? coursesCount.completedCourses[0].count
          : 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const counts = getCourseCount();
        const completedCourses = getCompletedCourses();
        const response = await fetch(
          "https://cbet-competency-based-education-training.onrender.com/api/resources/upload/users/data/pdf/student",
          {
            method: "GET",
            credentials: "include",
          },
        );
        const data = await response.json();
        const simulations = response.ok ? data.simulations || [] : [];
        const completedSimulations = simulations.filter(
          (simulation) => simulation.score !== null,
        );
        const pendingSimulations = simulations.filter(
          (simulation) => simulation.score === null,
        );
        const totalPoints = completedSimulations.reduce(
          (sum, simulation) => sum + (simulation.score || 0),
          0,
        );
        const averageScore =
          completedSimulations.length > 0
            ? Math.round(
                completedSimulations.reduce(
                  (sum, simulation) => sum + (simulation.percentage || 0),
                  0,
                ) / completedSimulations.length,
              )
            : 0;

        setSimulationItems(simulations);
        setStats({
          coursesInProgress: counts,
          completedCourses,
          pendingAssessments: pendingSimulations.length,
          averageScore,
          totalPoints,
          currentRank: totalPoints >= 300 ? "Gold" : "Starter",
          streakDays: completedSimulations.length,
          badgesEarned: completedSimulations.length,
        });

        setRecentActivities(
          completedSimulations.slice(0, 4).map((simulation, index) => ({
            id: simulation.id || index,
            title: `Scored ${simulation.percentage || 0}% in ${simulation.title}`,
            time: simulation.completedDate
              ? new Date(simulation.completedDate).toLocaleString()
              : "Recently",
            icon: <FiCheckCircle />,
            color: "#10b981",
          })),
        );

        setUpcomingDeadlines(
          pendingSimulations.slice(0, 3).map((simulation) => ({
            id: simulation.id,
            title: simulation.title,
            course: simulation.course,
            dueDate: `Estimated ${simulation.estimatedTimeMinutes} mins`,
            priority: "high",
          })),
        );

        setNotifications(
          simulations.slice(0, 3).map((simulation, index) => ({
            id: simulation.id || index,
            message:
              simulation.score === null
                ? `New AI simulation available: ${simulation.title}`
                : `Completed simulation: ${simulation.title}`,
            time: simulation.createdAt
              ? new Date(simulation.createdAt).toLocaleString()
              : "Recently",
            read: index > 0,
          })),
        );

        setRecommendedCourses(defaultRecommendedCourses);
      } catch (error) {
        setStats({
          coursesInProgress: getCourseCount(),
          completedCourses: getCompletedCourses(),
          pendingAssessments: 0,
          averageScore: 0,
          totalPoints: 0,
          currentRank: "Starter",
          streakDays: 0,
          badgesEarned: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [coursesCount]);

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

  const completionRate = simulationItems.length
    ? Math.round(
        (simulationItems.filter((simulation) => simulation.score !== null)
          .length /
          simulationItems.length) *
          100,
      )
    : 0;

  return (
    <div className={styles.homepage}>
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeHeader}>
          <div>
            <h1 className={styles.welcomeTitle}>Welcome back, {user.name}!</h1>
            <p className={styles.welcomeSubtitle}>
              {user.institution} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}{" "}
              Dashboard
            </p>
          </div>
          <div className={styles.notificationBadge}>
            <FiBell className={styles.notificationIcon} />
            {notifications.filter((notification) => !notification.read).length > 0 && (
              <span className={styles.notificationCount}>
                {notifications.filter((notification) => !notification.read).length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#e8f0fe", color: "#4f46e5" }}
          >
            <FiBookOpen />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.coursesInProgress || 0}</span>
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
            <span className={styles.statValue}>{stats.completedCourses || 0}</span>
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
            <span className={styles.statValue}>
              {stats.pendingAssessments || 0}
            </span>
            <span className={styles.statLabel}>Pending Simulations</span>
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
            <span className={styles.statValue}>{stats.averageScore || 0}%</span>
            <span className={styles.statLabel}>Average AI Score</span>
          </div>
        </div>
      </div>

      <div className={styles.gamificationStrip}>
        <div className={styles.gamificationItem}>
          <FiAward className={styles.gamificationIcon} />
          <div>
            <span className={styles.gamificationLabel}>Total Points</span>
            <span className={styles.gamificationValue}>{stats.totalPoints || 0}</span>
          </div>
        </div>
        <div className={styles.gamificationDivider}></div>
        <div className={styles.gamificationItem}>
          <FiStar className={styles.gamificationIcon} />
          <div>
            <span className={styles.gamificationLabel}>Current Rank</span>
            <span className={styles.gamificationValue}>
              {stats.currentRank || "N/A"}
            </span>
          </div>
        </div>
        <div className={styles.gamificationDivider}></div>
        <div className={styles.gamificationItem}>
          <FiClock className={styles.gamificationIcon} />
          <div>
            <span className={styles.gamificationLabel}>Completed AI Runs</span>
            <span className={styles.gamificationValue}>{stats.streakDays || 0}</span>
          </div>
        </div>
        <div className={styles.gamificationDivider}></div>
        <div className={styles.gamificationItem}>
          <FiAward className={styles.gamificationIcon} />
          <div>
            <span className={styles.gamificationLabel}>Badges Earned</span>
            <span className={styles.gamificationValue}>
              {stats.badgesEarned || 0}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent AI Simulation Activity</h2>
              <Link to="/scenarios" className={styles.viewAllLink}>
                View All <FiChevronRight />
              </Link>
            </div>
            <div className={styles.activityList}>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
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
                ))
              ) : (
                <div className={styles.activityItem}>
                  <div
                    className={styles.activityIcon}
                    style={{ background: "#dbeafe", color: "#2563eb" }}
                  >
                    <FiPlayCircle />
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityTitle}>
                      Your completed AI simulation attempts will appear here.
                    </p>
                    <span className={styles.activityTime}>No activity yet</span>
                  </div>
                </div>
              )}
            </div>
          </div>

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
                    <p className={styles.courseInstructor}>{course.instructor}</p>
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

        <div className={styles.rightColumn}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FiCalendar /> Pending AI Simulations
              </h2>
            </div>
            <div className={styles.deadlineList}>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline) => (
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
                ))
              ) : (
                <div className={styles.deadlineItem}>
                  <div
                    className={`${styles.deadlinePriority} ${getPriorityClass("low")}`}
                  ></div>
                  <div className={styles.deadlineContent}>
                    <h3 className={styles.deadlineTitle}>No pending simulations</h3>
                    <p className={styles.deadlineCourse}>
                      New AI-generated questions will show here after upload.
                    </p>
                    <span className={styles.deadlineDate}>
                      <FiClock /> Waiting for assigned content
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              className={styles.viewCalendarBtn}
              onClick={() => navigate("/scenarios")}
            >
              Open Simulations
            </button>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FiBarChart2 /> Progress Overview
              </h2>
            </div>
            <div className={styles.progressList}>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>Simulation Completion</span>
                  <span>{completionRate}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>Average AI Score</span>
                  <span>{stats.averageScore || 0}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${stats.averageScore || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>Total Points Earned</span>
                  <span>{stats.totalPoints || 0}</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((stats.totalPoints || 0) / 500) * 100),
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.quickActions}>
            <button
              className={styles.quickActionBtn}
              onClick={() => navigate("/scenarios")}
            >
              <FiPlayCircle /> Start AI Simulation
            </button>
            <button
              className={styles.quickActionBtn}
              onClick={() => navigate("/assessments")}
            >
              <FiFileText /> View Assessments
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
