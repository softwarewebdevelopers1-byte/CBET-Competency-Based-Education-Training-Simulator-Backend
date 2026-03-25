// src/components/courses/MyCourses.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/courses.module.css";
import {
  FiBookOpen,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
  FiPlayCircle,
  FiFileText,
  FiUsers,
  FiStar,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiMoreVertical,
  FiCalendar,
  FiBarChart2,
} from "react-icons/fi";

export function MyCourses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading courses
    setTimeout(() => {
      setCourses(mockCourses);
      setLoading(false);
    }, 1000);
  }, []);

  const mockCourses = [
    {
      id: 1,
      code: "ICT 304",
      title: "Network Security Fundamentals",
      instructor: "Dr. Sarah Kimani",
      description:
        "Learn the fundamentals of network security, including encryption, firewalls, and security protocols.",
      progress: 75,
      totalModules: 12,
      completedModules: 9,
      status: "in-progress",
      thumbnail: "🔒",
      category: "Information Technology",
      enrolledDate: "2026-01-15",
      lastAccessed: "2 hours ago",
      nextDeadline: "Network Security Quiz - Tomorrow",
      grade: "B+",
      materials: 24,
      assessments: 6,
      students: 45,
      rating: 4.5,
      tags: ["Security", "Networking", "Certification"],
    },
    {
      id: 2,
      code: "ICT 302",
      title: "Web Development with React",
      instructor: "Prof. John Omondi",
      description:
        "Master modern web development using React, Redux, and related technologies.",
      progress: 45,
      totalModules: 16,
      completedModules: 7,
      status: "in-progress",
      thumbnail: "⚛️",
      category: "Information Technology",
      enrolledDate: "2026-02-01",
      lastAccessed: "1 day ago",
      nextDeadline: "Portfolio Project - Due Dec 15",
      grade: "A-",
      materials: 32,
      assessments: 8,
      students: 38,
      rating: 4.8,
      tags: ["React", "JavaScript", "Frontend"],
    },
    {
      id: 3,
      code: "ICT 301",
      title: "Database Management Systems",
      instructor: "Eng. Mary Wanjiku",
      description:
        "Comprehensive study of database design, SQL, and database administration.",
      progress: 90,
      totalModules: 10,
      completedModules: 9,
      status: "almost-done",
      thumbnail: "🗄️",
      category: "Information Technology",
      enrolledDate: "2025-11-10",
      lastAccessed: "3 days ago",
      nextDeadline: "Final Exam - Dec 20",
      grade: "A",
      materials: 18,
      assessments: 5,
      students: 52,
      rating: 4.6,
      tags: ["SQL", "Database", "Backend"],
    },
    {
      id: 4,
      code: "ICT 401",
      title: "Software Engineering",
      instructor: "Dr. James Kariuki",
      description:
        "Learn software development lifecycle, methodologies, and best practices.",
      progress: 100,
      totalModules: 14,
      completedModules: 14,
      status: "completed",
      thumbnail: "💻",
      category: "Information Technology",
      enrolledDate: "2025-09-05",
      lastAccessed: "1 week ago",
      completedDate: "2026-11-30",
      grade: "A",
      materials: 28,
      assessments: 7,
      students: 41,
      rating: 4.7,
      tags: ["Software", "Development", "Agile"],
    },
    {
      id: 5,
      code: "ICT 303",
      title: "Python Programming",
      instructor: "Ms. Lucy Njeri",
      description:
        "Introduction to Python programming for data analysis and automation.",
      progress: 15,
      totalModules: 20,
      completedModules: 3,
      status: "just-started",
      thumbnail: "🐍",
      category: "Programming",
      enrolledDate: "2026-03-01",
      lastAccessed: "5 hours ago",
      nextDeadline: "Assignment 1 - Dec 10",
      grade: "N/A",
      materials: 40,
      assessments: 10,
      students: 67,
      rating: 4.9,
      tags: ["Python", "Programming", "Data Science"],
    },
    {
      id: 6,
      code: "ICT 402",
      title: "Cloud Computing",
      instructor: "Prof. David Otieno",
      description:
        "Study cloud architecture, AWS, Azure, and deployment strategies.",
      progress: 0,
      totalModules: 15,
      completedModules: 0,
      status: "not-started",
      thumbnail: "☁️",
      category: "Information Technology",
      enrolledDate: "2026-03-10",
      lastAccessed: "Never",
      nextDeadline: "Course starts Jan 2027",
      grade: "N/A",
      materials: 30,
      assessments: 6,
      students: 28,
      rating: 4.4,
      tags: ["Cloud", "AWS", "DevOps"],
    },
  ];

  const categories = [
    "All",
    "Information Technology",
    "Programming",
    "Networking",
    "Database",
    "Security",
    "Cloud Computing",
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return styles.statusCompleted;
      case "in-progress":
        return styles.statusInProgress;
      case "almost-done":
        return styles.statusAlmostDone;
      case "just-started":
        return styles.statusJustStarted;
      case "not-started":
        return styles.statusNotStarted;
      default:
        return "";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "almost-done":
        return "Almost Done";
      case "just-started":
        return "Just Started";
      case "not-started":
        return "Not Started";
      default:
        return status;
    }
  };

  const filteredCourses = courses
    .filter((course) => {
      if (selectedCategory === "all" || selectedCategory === "All") return true;
      return course.category === selectedCategory;
    })
    .filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.enrolledDate) - new Date(a.enrolledDate);
        case "progress":
          return b.progress - a.progress;
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "deadline":
          return a.nextDeadline.localeCompare(b.nextDeadline);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className={styles.coursesPage}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>My Courses</h1>
          <p className={styles.pageSubtitle}>
            You are enrolled in {courses.length} courses •{" "}
            {courses.filter((c) => c.progress === 100).length} completed
          </p>
        </div>
        <button className={styles.browseBtn}>
          <FiBookOpen /> Browse Catalog
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search courses by title, code, or instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterActions}>
          <button
            className={`${styles.filterBtn} ${showFilters ? styles.active : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
          </button>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === "grid" ? styles.activeView : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === "list" ? styles.activeView : ""}`}
              onClick={() => setViewMode("list")}
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.filterSelect}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat.toLowerCase()}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="recent">Recently Enrolled</option>
              <option value="progress">Progress</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="deadline">Upcoming Deadline</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <div className={styles.statusFilter}>
              <button className={styles.statusFilterBtn}>All</button>
              <button className={styles.statusFilterBtn}>In Progress</button>
              <button className={styles.statusFilterBtn}>Completed</button>
              <button className={styles.statusFilterBtn}>Not Started</button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Grid/List */}
      <div
        className={
          viewMode === "grid" ? styles.coursesGrid : styles.coursesList
        }
      >
        {filteredCourses.map((course) => (
          <div key={course.id} className={styles.courseCard}>
            {/* Card Header */}
            <div className={styles.cardHeader}>
              <div className={styles.courseThumbnail}>{course.thumbnail}</div>
              <div className={styles.courseInfo}>
                <span className={styles.courseCode}>{course.code}</span>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseInstructor}>{course.instructor}</p>
              </div>
              <button className={styles.moreBtn}>
                <FiMoreVertical />
              </button>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Progress</span>
                <span className={styles.progressPercentage}>
                  {course.progress}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
              <div className={styles.moduleProgress}>
                <FiBookOpen /> {course.completedModules}/{course.totalModules}{" "}
                modules
              </div>
            </div>

            {/* Course Stats */}
            <div className={styles.courseStats}>
              <div className={styles.statItem}>
                <FiFileText />
                <span>{course.materials} materials</span>
              </div>
              <div className={styles.statItem}>
                <FiUsers />
                <span>{course.students} students</span>
              </div>
              <div className={styles.statItem}>
                <FiStar />
                <span>{course.rating}</span>
              </div>
            </div>

            {/* Tags */}
            <div className={styles.tags}>
              {course.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Status and Deadline */}
            <div className={styles.cardFooter}>
              <div className={styles.statusSection}>
                <span
                  className={`${styles.statusBadge} ${getStatusColor(course.status)}`}
                >
                  {getStatusText(course.status)}
                </span>
                {course.grade !== "N/A" && (
                  <span className={styles.gradeBadge}>
                    Grade: {course.grade}
                  </span>
                )}
              </div>

              {course.nextDeadline && (
                <div className={styles.deadline}>
                  <FiClock /> {course.nextDeadline}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className={styles.cardActions}>
              <button
                className={styles.primaryAction}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                {course.status === "completed"
                  ? "Review Course"
                  : "Continue Learning"}
                <FiChevronRight />
              </button>
              <button className={styles.secondaryAction}>
                <FiEye />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className={styles.emptyState}>
          <FiBookOpen className={styles.emptyIcon} />
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters</p>
          <button
            className={styles.clearFiltersBtn}
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
              setSortBy("recent");
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
