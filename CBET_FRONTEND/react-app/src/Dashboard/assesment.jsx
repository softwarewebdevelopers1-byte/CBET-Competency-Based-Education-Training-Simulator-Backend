// src/components/assessments/AssessmentsPage.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/assessments.module.css";
import {
  FiFileText,
  FiClock,
  FiAward,
  FiStar,
  FiChevronRight,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiCalendar,
  FiBarChart2,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiPlayCircle,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCpu,
  FiBookOpen,
  FiTrendingUp,
} from "react-icons/fi";

export function AssessmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading assessments
    setTimeout(() => {
      setAssessments(mockAssessments);
      setLoading(false);
    }, 1000);
  }, []);

  const mockAssessments = [
    // AI-Generated Assessments
    {
      id: 1,
      title: "Network Security Fundamentals - Quiz",
      type: "quiz",
      category: "ai-generated",
      description:
        "AI-generated quiz covering network security basics, including firewalls, encryption, and security protocols.",
      course: "ICT 304 - Network Security",
      instructor: "Dr. Sarah Kimani",
      dueDate: "2026-03-20",
      timeLimit: 30, // minutes
      totalQuestions: 20,
      totalPoints: 100,
      passingScore: 70,
      status: "pending",
      attempts: 2,
      maxAttempts: 3,
      averageScore: 78,
      participants: 45,
      difficulty: "intermediate",
      tags: ["Security", "Networking", "AI-Generated"],
      aiGenerated: true,
      sourceMaterials: ["Network Security PDF", "Firewall Configuration Video"],
      lastAttempt: "2026-03-15",
    },
    {
      id: 2,
      title: "JavaScript Programming Concepts",
      type: "quiz",
      category: "ai-generated",
      description:
        "AI assessment on JavaScript fundamentals, including closures, promises, and ES6 features.",
      course: "ICT 302 - Web Development",
      instructor: "Prof. John Omondi",
      dueDate: "2026-03-22",
      timeLimit: 45,
      totalQuestions: 25,
      totalPoints: 125,
      passingScore: 75,
      status: "completed",
      attempts: 2,
      maxAttempts: 3,
      score: 92,
      grade: "A",
      averageScore: 81,
      participants: 38,
      difficulty: "intermediate",
      tags: ["JavaScript", "Programming", "AI-Generated"],
      aiGenerated: true,
      sourceMaterials: ["React Tutorial", "JavaScript Basics Video"],
      completedDate: "2026-03-10",
    },
    {
      id: 3,
      title: "Database Design Principles",
      type: "exam",
      category: "ai-generated",
      description:
        "Comprehensive AI-generated exam on database normalization, SQL queries, and ER diagrams.",
      course: "ICT 301 - Database Management",
      instructor: "Eng. Mary Wanjiku",
      dueDate: "2026-03-25",
      timeLimit: 90,
      totalQuestions: 40,
      totalPoints: 200,
      passingScore: 60,
      status: "not-started",
      attempts: 0,
      maxAttempts: 2,
      averageScore: 72,
      participants: 52,
      difficulty: "advanced",
      tags: ["SQL", "Database", "AI-Generated"],
      aiGenerated: true,
      sourceMaterials: ["Database Design PDF", "SQL Tutorial Video"],
    },

    // Trainer-Created Assessments
    {
      id: 4,
      title: "Network Configuration Practical",
      type: "practical",
      category: "trainer-created",
      description:
        "Hands-on practical assessment: Configure a small network with routers and switches.",
      course: "ICT 304 - Network Security",
      instructor: "Dr. Sarah Kimani",
      dueDate: "2026-03-18",
      timeLimit: 120,
      totalPoints: 150,
      passingScore: 80,
      status: "pending",
      attempts: 1,
      maxAttempts: 2,
      averageScore: 85,
      participants: 45,
      difficulty: "advanced",
      tags: ["Cisco", "Routing", "Switching"],
      aiGenerated: false,
      resources: ["Network Simulator", "Configuration Guide"],
    },
    {
      id: 5,
      title: "React Component Development",
      type: "practical",
      category: "trainer-created",
      description:
        "Build a responsive React application with state management and API integration.",
      course: "ICT 302 - Web Development",
      instructor: "Prof. John Omondi",
      dueDate: "2026-03-28",
      timeLimit: 180,
      totalPoints: 200,
      passingScore: 70,
      status: "not-started",
      attempts: 0,
      maxAttempts: 1,
      averageScore: 88,
      participants: 38,
      difficulty: "intermediate",
      tags: ["React", "JavaScript", "API"],
      aiGenerated: false,
      resources: ["Starter Code", "API Documentation"],
    },
    {
      id: 6,
      title: "Mid-Term Examination: Python Programming",
      type: "exam",
      category: "trainer-created",
      description:
        "Comprehensive mid-term exam covering Python fundamentals, OOP, and data structures.",
      course: "ICT 303 - Python Programming",
      instructor: "Ms. Lucy Njeri",
      dueDate: "2026-03-15",
      timeLimit: 120,
      totalQuestions: 50,
      totalPoints: 250,
      passingScore: 65,
      status: "completed",
      attempts: 1,
      maxAttempts: 1,
      score: 215,
      grade: "A-",
      averageScore: 178,
      participants: 67,
      difficulty: "intermediate",
      tags: ["Python", "OOP", "Exam"],
      aiGenerated: false,
      completedDate: "2026-03-12",
    },

    // Continuous Assessments
    {
      id: 7,
      title: "Weekly Quiz: Network Protocols",
      type: "quiz",
      category: "continuous",
      description: "Weekly assessment on TCP/IP, UDP, and network protocols.",
      course: "ICT 304 - Network Security",
      instructor: "Dr. Sarah Kimani",
      dueDate: "2026-03-17",
      timeLimit: 20,
      totalQuestions: 10,
      totalPoints: 50,
      passingScore: 60,
      status: "pending",
      attempts: 2,
      maxAttempts: 3,
      averageScore: 82,
      participants: 45,
      difficulty: "beginner",
      tags: ["TCP/IP", "Protocols", "Weekly"],
      aiGenerated: false,
      frequency: "weekly",
    },
    {
      id: 8,
      title: "Monthly Assessment: Database Optimization",
      type: "exam",
      category: "continuous",
      description:
        "Monthly assessment on query optimization, indexing, and performance tuning.",
      course: "ICT 301 - Database Management",
      instructor: "Eng. Mary Wanjiku",
      dueDate: "2026-03-30",
      timeLimit: 60,
      totalQuestions: 30,
      totalPoints: 150,
      passingScore: 70,
      status: "not-started",
      attempts: 0,
      maxAttempts: 2,
      averageScore: 75,
      participants: 52,
      difficulty: "intermediate",
      tags: ["Optimization", "Performance", "Monthly"],
      aiGenerated: true,
      frequency: "monthly",
    },

    // Practice Assessments
    {
      id: 9,
      title: "Practice: SQL Queries",
      type: "practice",
      category: "practice",
      description: "Ungraded practice assessment for SQL query writing.",
      course: "ICT 301 - Database Management",
      instructor: "Eng. Mary Wanjiku",
      timeLimit: 45,
      totalQuestions: 15,
      totalPoints: 0,
      status: "available",
      attempts: 5,
      maxAttempts: 999,
      averageScore: 0,
      participants: 34,
      difficulty: "beginner",
      tags: ["SQL", "Practice", "Ungraded"],
      aiGenerated: true,
      bestScore: 90,
    },
    {
      id: 10,
      title: "Practice: JavaScript Challenges",
      type: "practice",
      category: "practice",
      description: "Coding challenges to practice JavaScript concepts.",
      course: "ICT 302 - Web Development",
      instructor: "Prof. John Omondi",
      timeLimit: 60,
      totalQuestions: 10,
      totalPoints: 0,
      status: "available",
      attempts: 3,
      maxAttempts: 999,
      averageScore: 0,
      participants: 41,
      difficulty: "intermediate",
      tags: ["JavaScript", "Coding", "Practice"],
      aiGenerated: false,
      bestScore: 85,
    },
  ];

  const categories = [
    {
      id: "all",
      name: "All Assessments",
      icon: "📋",
      count: assessments.length,
    },
    {
      id: "pending",
      name: "Pending",
      icon: "⏳",
      count: assessments.filter((a) => a.status === "pending").length,
    },
    {
      id: "completed",
      name: "Completed",
      icon: "✅",
      count: assessments.filter((a) => a.status === "completed").length,
    },
    {
      id: "not-started",
      name: "Not Started",
      icon: "🔴",
      count: assessments.filter((a) => a.status === "not-started").length,
    },
    {
      id: "ai-generated",
      name: "AI Generated",
      icon: "🤖",
      count: assessments.filter((a) => a.aiGenerated).length,
    },
    {
      id: "trainer-created",
      name: "Trainer Created",
      icon: "👨‍🏫",
      count: assessments.filter(
        (a) => !a.aiGenerated && a.category === "trainer-created",
      ).length,
    },
    {
      id: "continuous",
      name: "Continuous",
      icon: "📊",
      count: assessments.filter((a) => a.category === "continuous").length,
    },
    {
      id: "practice",
      name: "Practice",
      icon: "🎯",
      count: assessments.filter((a) => a.category === "practice").length,
    },
    {
      id: "quiz",
      name: "Quizzes",
      icon: "📝",
      count: assessments.filter((a) => a.type === "quiz").length,
    },
    {
      id: "exam",
      name: "Exams",
      icon: "📚",
      count: assessments.filter((a) => a.type === "exam").length,
    },
    {
      id: "practical",
      name: "Practical",
      icon: "🔧",
      count: assessments.filter((a) => a.type === "practical").length,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return { bg: "#d1fae5", color: "#065f46", icon: <FiCheckCircle /> };
      case "pending":
        return { bg: "#fef3c7", color: "#92400e", icon: <FiClock /> };
      case "not-started":
        return { bg: "#fee2e2", color: "#991b1b", icon: <FiAlertCircle /> };
      case "available":
        return { bg: "#dbeafe", color: "#1e40af", icon: <FiPlayCircle /> };
      default:
        return { bg: "#e2e8f0", color: "#4a5568", icon: <FiFileText /> };
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return { bg: "#d1fae5", color: "#065f46" };
      case "intermediate":
        return { bg: "#fef3c7", color: "#92400e" };
      case "advanced":
        return { bg: "#fee2e2", color: "#991b1b" };
      default:
        return { bg: "#e2e8f0", color: "#4a5568" };
    }
  };

  const filteredAssessments = assessments
    .filter((assessment) => {
      if (selectedCategory === "all") return true;
      if (selectedCategory === "pending")
        return assessment.status === "pending";
      if (selectedCategory === "completed")
        return assessment.status === "completed";
      if (selectedCategory === "not-started")
        return assessment.status === "not-started";
      if (selectedCategory === "ai-generated") return assessment.aiGenerated;
      if (selectedCategory === "trainer-created")
        return (
          !assessment.aiGenerated && assessment.category === "trainer-created"
        );
      return (
        assessment.category === selectedCategory ||
        assessment.type === selectedCategory
      );
    })
    .filter(
      (assessment) =>
        assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assessment.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.dueDate || b.completedDate || 0) -
            new Date(a.dueDate || a.completedDate || 0)
          );
        case "due":
          return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "points":
          return b.totalPoints - a.totalPoints;
        case "difficulty":
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          return (
            (difficultyOrder[b.difficulty] || 0) -
            (difficultyOrder[a.difficulty] || 0)
          );
        default:
          return 0;
      }
    });

  const stats = {
    total: assessments.length,
    pending: assessments.filter((a) => a.status === "pending").length,
    completed: assessments.filter((a) => a.status === "completed").length,
    averageScore:
      Math.round(
        assessments
          .filter((a) => a.score)
          .reduce((sum, a) => sum + (a.score / a.totalPoints) * 100, 0) /
          assessments.filter((a) => a.score).length,
      ) || 0,
    totalPoints: assessments
      .filter((a) => a.score)
      .reduce((sum, a) => sum + a.score, 0),
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className={styles.assessmentsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Assessments</h1>
          <p className={styles.pageSubtitle}>
            Track and complete your quizzes, exams, and practical assessments
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.aiGenerateBtn}>
            <FiCpu /> Generate with AI
          </button>
          <button className={styles.createBtn}>
            <FiPlus /> Create Assessment
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#e8f0fe", color: "#4f46e5" }}
          >
            <FiFileText />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Assessments</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fef3c7", color: "#f59e0b" }}
          >
            <FiClock />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>Pending</span>
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
            <span className={styles.statValue}>{stats.completed}</span>
            <span className={styles.statLabel}>Completed</span>
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
            <span className={styles.statLabel}>Avg. Score</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fed7d7", color: "#e53e3e" }}
          >
            <FiAward />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalPoints}</span>
            <span className={styles.statLabel}>Points Earned</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#c6f6d5", color: "#2f855a" }}
          >
            <FiBarChart2 />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {Math.round((stats.completed / stats.total) * 100)}%
            </span>
            <span className={styles.statLabel}>Completion Rate</span>
          </div>
        </div>
      </div>

      {/* AI Assessment Banner */}
      <div className={styles.aiBanner}>
        <div className={styles.aiBannerContent}>
          <FiCpu className={styles.aiBannerIcon} />
          <div>
            <h3>AI-Powered Assessment Generation</h3>
            <p>
              Upload your learning materials and let AI create customized
              assessments instantly
            </p>
          </div>
          <button className={styles.tryAiBtn}>
            Try AI Generator <FiChevronRight />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search assessments by title, course, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterActions}>
          <div className={styles.sortSelect}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortDropdown}
            >
              <option value="recent">Most Recent</option>
              <option value="due">Due Date</option>
              <option value="title">Title</option>
              <option value="points">Points</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>
          <button
            className={`${styles.filterBtn} ${showFilters ? styles.active : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filter
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

      {/* Categories */}
      <div className={styles.categories}>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.categoryBtn} ${selectedCategory === category.id ? styles.activeCategory : ""}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
            <span className={styles.categoryCount}>{category.count}</span>
          </button>
        ))}
      </div>

      {/* Assessments Grid/List */}
      <div
        className={
          viewMode === "grid" ? styles.assessmentsGrid : styles.assessmentsList
        }
      >
        {filteredAssessments.map((assessment) => {
          const status = getStatusColor(assessment.status);
          const difficulty = getDifficultyColor(assessment.difficulty);

          return (
            <div
              key={assessment.id}
              className={styles.assessmentCard}
              onClick={() => {
                setSelectedAssessment(assessment);
                setShowDetailsModal(true);
              }}
            >
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.assessmentType}>
                  {assessment.type === "quiz" && "📝"}
                  {assessment.type === "exam" && "📚"}
                  {assessment.type === "practical" && "🔧"}
                  {assessment.type === "practice" && "🎯"}
                </div>
                <div className={styles.assessmentInfo}>
                  <h3 className={styles.assessmentTitle}>{assessment.title}</h3>
                  <p className={styles.assessmentCourse}>{assessment.course}</p>
                </div>
                {assessment.aiGenerated && (
                  <div className={styles.aiBadge} title="AI-Generated">
                    <FiCpu />
                  </div>
                )}
              </div>

              {/* Description */}
              <p className={styles.assessmentDescription}>
                {assessment.description}
              </p>

              {/* Meta Info */}
              <div className={styles.metaInfo}>
                <span className={styles.metaItem}>
                  <FiClock /> {assessment.timeLimit} mins
                </span>
                <span className={styles.metaItem}>
                  <FiFileText /> {assessment.totalQuestions || "Practical"}{" "}
                  questions
                </span>
                <span className={styles.metaItem}>
                  <FiAward /> {assessment.totalPoints} pts
                </span>
              </div>

              {/* Tags */}
              <div className={styles.tags}>
                {assessment.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
                {assessment.tags.length > 3 && (
                  <span className={styles.tag}>
                    +{assessment.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Status and Due Date */}
              <div className={styles.cardFooter}>
                <div className={styles.statusSection}>
                  <span
                    className={styles.statusBadge}
                    style={{ background: status.bg, color: status.color }}
                  >
                    {status.icon} {assessment.status}
                  </span>
                  <span
                    className={styles.difficultyBadge}
                    style={{
                      background: difficulty.bg,
                      color: difficulty.color,
                    }}
                  >
                    {assessment.difficulty}
                  </span>
                </div>

                {assessment.dueDate && (
                  <div className={styles.dueDate}>
                    <FiCalendar /> Due:{" "}
                    {new Date(assessment.dueDate).toLocaleDateString()}
                  </div>
                )}

                {assessment.status === "completed" && assessment.score && (
                  <div className={styles.score}>
                    Score: {assessment.score}/{assessment.totalPoints} (
                    {Math.round(
                      (assessment.score / assessment.totalPoints) * 100,
                    )}
                    %)
                  </div>
                )}

                {assessment.status === "pending" && (
                  <div className={styles.attempts}>
                    Attempts: {assessment.attempts}/{assessment.maxAttempts}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={styles.cardActions}>
                {assessment.status === "completed" ? (
                  <button className={styles.reviewBtn}>
                    <FiEye /> Review
                  </button>
                ) : assessment.status === "pending" ? (
                  <button className={styles.continueBtn}>
                    <FiPlayCircle /> Continue
                  </button>
                ) : (
                  <button className={styles.startBtn}>
                    <FiPlayCircle /> Start Assessment
                  </button>
                )}

                {assessment.status === "completed" && (
                  <button className={styles.retakeBtn}>
                    <FiRefreshCw /> Retake
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAssessments.length === 0 && (
        <div className={styles.emptyState}>
          <FiFileText className={styles.emptyIcon} />
          <h3>No assessments found</h3>
          <p>Try adjusting your search or filter criteria</p>
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

      {/* Assessment Details Modal */}
      {showDetailsModal && selectedAssessment && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className={styles.detailsModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailsHeader}>
              <div className={styles.detailsTitle}>
                <span className={styles.detailsIcon}>
                  {selectedAssessment.type === "quiz" && "📝"}
                  {selectedAssessment.type === "exam" && "📚"}
                  {selectedAssessment.type === "practical" && "🔧"}
                  {selectedAssessment.type === "practice" && "🎯"}
                </span>
                <div>
                  <h2>{selectedAssessment.title}</h2>
                  <p>
                    {selectedAssessment.course} •{" "}
                    {selectedAssessment.instructor}
                  </p>
                </div>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.detailsContent}>
              {/* Quick Stats */}
              <div className={styles.quickStats}>
                <div className={styles.quickStat}>
                  <FiClock />
                  <div>
                    <span className={styles.quickStatLabel}>Time Limit</span>
                    <span className={styles.quickStatValue}>
                      {selectedAssessment.timeLimit} mins
                    </span>
                  </div>
                </div>
                <div className={styles.quickStat}>
                  <FiFileText />
                  <div>
                    <span className={styles.quickStatLabel}>Questions</span>
                    <span className={styles.quickStatValue}>
                      {selectedAssessment.totalQuestions || "Practical"}
                    </span>
                  </div>
                </div>
                <div className={styles.quickStat}>
                  <FiAward />
                  <div>
                    <span className={styles.quickStatLabel}>Total Points</span>
                    <span className={styles.quickStatValue}>
                      {selectedAssessment.totalPoints}
                    </span>
                  </div>
                </div>
                <div className={styles.quickStat}>
                  <FiUsers />
                  <div>
                    <span className={styles.quickStatLabel}>Participants</span>
                    <span className={styles.quickStatValue}>
                      {selectedAssessment.participants}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={styles.detailsSection}>
                <h3>Description</h3>
                <p>{selectedAssessment.description}</p>
              </div>

              {/* AI Generated Info */}
              {selectedAssessment.aiGenerated && (
                <div className={styles.aiInfo}>
                  <FiCpu className={styles.aiInfoIcon} />
                  <div>
                    <h4>AI-Generated Assessment</h4>
                    <p>
                      This assessment was automatically generated from the
                      following materials:
                    </p>
                    <ul>
                      {selectedAssessment.sourceMaterials?.map(
                        (material, index) => (
                          <li key={index}>{material}</li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className={styles.detailsSection}>
                <h3>Requirements</h3>
                <ul className={styles.requirementsList}>
                  <li>Passing score: {selectedAssessment.passingScore}%</li>
                  <li>Maximum attempts: {selectedAssessment.maxAttempts}</li>
                  {selectedAssessment.dueDate && (
                    <li>
                      Due date:{" "}
                      {new Date(
                        selectedAssessment.dueDate,
                      ).toLocaleDateString()}
                    </li>
                  )}
                </ul>
              </div>

              {/* Tags */}
              <div className={styles.detailsSection}>
                <h3>Topics Covered</h3>
                <div className={styles.tags}>
                  {selectedAssessment.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div className={styles.detailsSection}>
                <h3>Class Statistics</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statItemLabel}>Average Score</span>
                    <span className={styles.statItemValue}>
                      {selectedAssessment.averageScore}%
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statItemLabel}>
                      Completion Rate
                    </span>
                    <span className={styles.statItemValue}>
                      {Math.round(
                        (selectedAssessment.participants / 100) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statItemLabel}>Difficulty</span>
                    <span className={styles.statItemValue}>
                      {selectedAssessment.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Stats (if completed) */}
              {selectedAssessment.status === "completed" &&
                selectedAssessment.score && (
                  <div className={styles.personalStats}>
                    <h3>Your Performance</h3>
                    <div className={styles.scoreCircle}>
                      <svg viewBox="0 0 36 36" className={styles.circularChart}>
                        <path
                          className={styles.circleBg}
                          d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={styles.circle}
                          strokeDasharray={`${Math.round((selectedAssessment.score / selectedAssessment.totalPoints) * 100)}, 100`}
                          d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className={styles.percentage}>
                          {Math.round(
                            (selectedAssessment.score /
                              selectedAssessment.totalPoints) *
                              100,
                          )}
                          %
                        </text>
                      </svg>
                    </div>
                    <div className={styles.scoreDetails}>
                      <p>
                        Score: {selectedAssessment.score}/
                        {selectedAssessment.totalPoints}
                      </p>
                      <p>Grade: {selectedAssessment.grade}</p>
                      <p>
                        Completed:{" "}
                        {new Date(
                          selectedAssessment.completedDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <div className={styles.detailsActions}>
              {selectedAssessment.status === "completed" ? (
                <>
                  <button className={styles.reviewDetailsBtn}>
                    <FiEye /> Review Answers
                  </button>
                  <button className={styles.retakeDetailsBtn}>
                    <FiRefreshCw /> Retake Assessment
                  </button>
                </>
              ) : selectedAssessment.status === "pending" ? (
                <>
                  <button className={styles.continueDetailsBtn}>
                    <FiPlayCircle /> Continue
                  </button>
                  <button className={styles.restartBtn}>
                    <FiRefreshCw /> Restart
                  </button>
                </>
              ) : (
                <button className={styles.startDetailsBtn}>
                  <FiPlayCircle /> Start Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
