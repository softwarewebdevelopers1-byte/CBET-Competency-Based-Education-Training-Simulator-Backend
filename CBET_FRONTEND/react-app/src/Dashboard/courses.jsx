// src/components/courses/MyCourses.jsx

import React, { useState, useEffect, useContext } from "react";
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
import { CourseContext } from "./dashboard.jsx";

export function MyCourses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  let data = useContext(CourseContext);
  console.log(data);
  function getCompletedCourses() {
    try {
      if (data && data.count && Array.isArray(data.count)) {
        return data.count.length > 0 ? data.completedCourses[0].count : 0;
      }
      return 0;
    } catch (error) {
      console.error("CBET error happenned", error);
      return 0;
    }
  }

  useEffect(() => {
    async function GetData() {
      try {
        setLoading(true);

        // Extract courses from the response
        const studentCourses = data.courses || [];

        // Transform the data to match the expected format
        const transformedCourses = studentCourses.map((course, index) => ({
          id: course._id || index,
          code: course.unitCode || "N/A",
          title: course.unitName || course.courseTitle || "Untitled Course",
          instructor: course.instructor || "Staff",
          description:
            course.description || course.unitName || "No description available",
          progress: course.progress || Math.floor(Math.random() * 100), // You'll need to implement actual progress tracking
          totalModules: course.totalModules || 1,
          completedModules: course.completedModules || 0,
          status: course.status || "in-progress",
          thumbnail: getThumbnailIcon(course.unitName || course.courseTitle),
          category: course.department || course.courseTitle || "General",
          enrolledDate:
            course.enrolledDate || new Date().toISOString().split("T")[0],
          lastAccessed: course.lastAccessed || "Recently",
          nextDeadline: course.nextDeadline || "No upcoming deadlines",
          grade: course.grade || "N/A",
          materials: course.materials || 0,
          assessments: course.assessments || 0,
          students: course.students || 0,
          rating: course.rating || 4.0,
          tags: course.tags || extractTags(course),
          department: course.department,
          courseTitle: course.courseTitle,
          unitCode: course.unitCode,
          unitName: course.unitName,
        }));

        setCourses(transformedCourses);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    }

    GetData();
  }, []);

  // Helper function to get thumbnail icon based on course name
  const getThumbnailIcon = (courseName) => {
    if (!courseName) return "📚";
    const name = courseName.toLowerCase();
    if (
      name.includes("programming") ||
      name.includes("python") ||
      name.includes("javascript")
    )
      return "💻";
    if (name.includes("database")) return "🗄️";
    if (name.includes("network") || name.includes("security")) return "🔒";
    if (name.includes("web")) return "🌐";
    if (name.includes("cloud")) return "☁️";
    if (name.includes("software")) return "⚙️";
    if (name.includes("informatics")) return "📊";
    return "📚";
  };

  // Helper function to extract tags from course data
  const extractTags = (course) => {
    const tags = [];
    if (course.department) tags.push(course.department);
    if (course.courseTitle) tags.push(course.courseTitle.split(" ")[0]);
    if (course.unitCode) tags.push(course.unitCode.split("")[0]);
    return tags.slice(0, 3); // Return at most 3 tags
  };

  // Get unique categories from actual courses
  const categories = [
    "All",
    ...new Set(courses.map((course) => course.category).filter(Boolean)),
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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
        return styles.statusInProgress;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
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
        return status || "In Progress";
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
        (course.instructor &&
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase())),
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
          return (a.nextDeadline || "").localeCompare(b.nextDeadline || "");
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
            {getCompletedCourses()} completed
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
            {course.tags && course.tags.length > 0 && (
              <div className={styles.tags}>
                {course.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Status and Deadline */}
            <div className={styles.cardFooter}>
              <div className={styles.statusSection}>
                <span
                  className={`${styles.statusBadge} ${getStatusColor(course.status)}`}
                >
                  {getStatusText(course.status)}
                </span>
                {course.grade !== "N/A" && course.grade && (
                  <span className={styles.gradeBadge}>
                    Grade: {course.grade}
                  </span>
                )}
              </div>

              {course.nextDeadline &&
                course.nextDeadline !== "No upcoming deadlines" && (
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
