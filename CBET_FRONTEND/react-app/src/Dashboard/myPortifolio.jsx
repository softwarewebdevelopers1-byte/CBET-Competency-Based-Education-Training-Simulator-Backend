// src/components/portfolio/MyPortfolio.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/portfolio.module.css";
import {
  FiFolder,
  FiUpload,
  FiFileText,
  FiImage,
  FiVideo,
  FiLink,
  FiDownload,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiAward,
  FiStar,
  FiUsers,
  FiCalendar,
  FiChevronRight,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiUserCheck,
  FiMessageCircle,
  FiShare2,
} from "react-icons/fi";

export function MyPortfolio() {
  const [loading, setLoading] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const response = await fetch(
          "https://cbet-competency-based-education-training.onrender.com/api/resources/upload/users/data/pdf/student/portfolio",
          {
            method: "GET",
            credentials: "include",
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load portfolio");
        }

        setPortfolioItems(data.portfolioItems || []);
        setStudentProfile(data.student || null);
      } catch (error) {
        setErrorMessage(error.message || "Unable to load portfolio");
        setPortfolioItems([]);
        setStudentProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, []);
  const categories = [
    { id: "all", name: "All Items", icon: "📁", count: portfolioItems.length },
    {
      id: "project",
      name: "Projects",
      icon: "💻",
      count: portfolioItems.filter((i) => i.category === "project").length,
    },
    {
      id: "practical",
      name: "Practical Work",
      icon: "🔧",
      count: portfolioItems.filter((i) => i.category === "practical").length,
    },
    {
      id: "internship",
      name: "Internships",
      icon: "💼",
      count: portfolioItems.filter((i) => i.category === "internship").length,
    },
    {
      id: "achievement",
      name: "Achievements",
      icon: "🏆",
      count: portfolioItems.filter((i) => i.category === "achievement").length,
    },
    {
      id: "work-sample",
      name: "Work Samples",
      icon: "📎",
      count: portfolioItems.filter((i) => i.category === "work-sample").length,
    },
  ];

  const statusColors = {
    approved: { bg: "#d1fae5", color: "#065f46", icon: <FiCheckCircle /> },
    pending: { bg: "#fef3c7", color: "#92400e", icon: <FiClock /> },
    draft: { bg: "#e2e8f0", color: "#4a5568", icon: <FiFileText /> },
    rejected: { bg: "#fee2e2", color: "#991b1b", icon: <FiAlertCircle /> },
  };

  const getStatusColor = (status) => {
    return statusColors[status] || statusColors.draft;
  };

  const filteredItems = portfolioItems
    .filter((item) => {
      if (selectedCategory === "all") return true;
      return item.category === selectedCategory;
    })
    .filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.skills.some((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

  const stats = {
    totalItems: portfolioItems.length,
    approvedItems: portfolioItems.filter((i) => i.status === "approved").length,
    pendingItems: portfolioItems.filter((i) => i.status === "pending").length,
    totalPoints: portfolioItems
      .filter((i) => i.status === "approved")
      .reduce((sum, i) => sum + (i.points || 0), 0),
    totalBadges: portfolioItems
      .filter((i) => i.status === "approved")
      .reduce((sum, i) => sum + (i.badges?.length || 0), 0),
    verifiedItems: portfolioItems.filter((i) => i.verifications?.length > 0)
      .length,
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your portfolio...</p>
      </div>
    );
  }

  return (
    <div className={styles.portfolioPage}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>My Portfolio</h1>
          <p className={styles.pageSubtitle}>
            {studentProfile
              ? `${studentProfile.fullName} • ${studentProfile.programme} • Year ${studentProfile.yearOfStudy}`
              : "Your verified portfolio records from completed simulations"}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.shareBtn}>
            <FiShare2 /> Share Portfolio
          </button>
          <button
            className={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus /> Add Item
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className={styles.infoBanner}>{errorMessage}</div>
      ) : null}

      {/* Stats Overview */}
      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#e8f0fe", color: "#4f46e5" }}
          >
            <FiFolder />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalItems}</span>
            <span className={styles.statLabel}>Total Items</span>
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
            <span className={styles.statValue}>{stats.approvedItems}</span>
            <span className={styles.statLabel}>Approved</span>
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
            <span className={styles.statValue}>{stats.pendingItems}</span>
            <span className={styles.statLabel}>Pending Review</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fae8ff", color: "#8b5cf6" }}
          >
            <FiAward />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalPoints}</span>
            <span className={styles.statLabel}>Total Points</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fed7d7", color: "#e53e3e" }}
          >
            <FiStar />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalBadges}</span>
            <span className={styles.statLabel}>Badges Earned</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#c6f6d5", color: "#2f855a" }}
          >
            <FiUserCheck />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.verifiedItems}</span>
            <span className={styles.statLabel}>Verified</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search portfolio items..."
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

      {/* Portfolio Grid/List */}
      <div
        className={
          viewMode === "grid" ? styles.portfolioGrid : styles.portfolioList
        }
      >
        {filteredItems.map((item) => {
          const status = getStatusColor(item.status);
          return (
            <div
              key={item.id}
              className={styles.portfolioCard}
              onClick={() => setSelectedItem(item)}
            >
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.itemThumbnail}>{item.thumbnail}</div>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  <span className={styles.itemType}>{item.type}</span>
                </div>
                <div
                  className={styles.itemStatus}
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.icon} {item.status}
                </div>
              </div>

              {/* Description */}
              <p className={styles.itemDescription}>{item.description}</p>

              {/* Skills */}
              <div className={styles.skills}>
                {item.skills.slice(0, 4).map((skill, index) => (
                  <span key={index} className={styles.skill}>
                    {skill}
                  </span>
                ))}
                {item.skills.length > 4 && (
                  <span className={styles.skill}>
                    +{item.skills.length - 4}
                  </span>
                )}
              </div>

              {/* Media Stats */}
              <div className={styles.mediaStats}>
                {item.images > 0 && (
                  <span className={styles.mediaStat}>
                    <FiImage /> {item.images}
                  </span>
                )}
                {item.documents > 0 && (
                  <span className={styles.mediaStat}>
                    <FiFileText /> {item.documents}
                  </span>
                )}
                {item.videos > 0 && (
                  <span className={styles.mediaStat}>
                    <FiVideo /> {item.videos}
                  </span>
                )}
                {item.liveUrl && (
                  <span className={styles.mediaStat}>
                    <FiLink /> Live
                  </span>
                )}
                {item.githubUrl && (
                  <span className={styles.mediaStat}>
                    <FiLink /> GitHub
                  </span>
                )}
              </div>

              {/* Card Footer */}
              <div className={styles.cardFooter}>
                <div className={styles.itemMeta}>
                  <FiCalendar /> {new Date(item.date).toLocaleDateString()}
                </div>
                <div className={styles.itemActions}>
                  {item.grade && item.grade !== "In Progress" && (
                    <span className={styles.grade}>Grade: {item.grade}</span>
                  )}
                  {item.points > 0 && (
                    <span className={styles.points}>
                      <FiAward /> {item.points} pts
                    </span>
                  )}
                </div>
              </div>

              {/* Verification Badge */}
              {item.verifications?.length > 0 && (
                <div className={styles.verificationBadge}>
                  <FiUserCheck /> Verified by {item.verifications[0].verifier}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className={styles.emptyState}>
          <FiFolder className={styles.emptyIcon} />
          <h3>No portfolio items found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button
            className={styles.clearFiltersBtn}
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAddModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add Portfolio Item</h2>
            <p className={styles.modalSubtitle}>
              Select the type of item you want to add
            </p>

            <div className={styles.addOptions}>
              <button
                className={styles.addOption}
                onClick={() => navigate("/portfolio/add/project")}
              >
                <span className={styles.addOptionIcon}>💻</span>
                <span className={styles.addOptionTitle}>Project</span>
                <span className={styles.addOptionDesc}>
                  Add a completed project
                </span>
              </button>

              <button
                className={styles.addOption}
                onClick={() => navigate("/portfolio/add/practical")}
              >
                <span className={styles.addOptionIcon}>🔧</span>
                <span className={styles.addOptionTitle}>Practical Work</span>
                <span className={styles.addOptionDesc}>
                  Document hands-on exercises
                </span>
              </button>

              <button
                className={styles.addOption}
                onClick={() => navigate("/portfolio/add/internship")}
              >
                <span className={styles.addOptionIcon}>💼</span>
                <span className={styles.addOptionTitle}>Internship</span>
                <span className={styles.addOptionDesc}>
                  Log your internship experience
                </span>
              </button>

              <button
                className={styles.addOption}
                onClick={() => navigate("/portfolio/add/achievement")}
              >
                <span className={styles.addOptionIcon}>🏆</span>
                <span className={styles.addOptionTitle}>Achievement</span>
                <span className={styles.addOptionDesc}>
                  Showcase certifications & awards
                </span>
              </button>

              <button
                className={styles.addOption}
                onClick={() => navigate("/portfolio/add/work-sample")}
              >
                <span className={styles.addOptionIcon}>📎</span>
                <span className={styles.addOptionTitle}>Work Sample</span>
                <span className={styles.addOptionDesc}>
                  Upload samples of your work
                </span>
              </button>
            </div>

            <button
              className={styles.closeModalBtn}
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={styles.detailsModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailsHeader}>
              <div className={styles.detailsTitle}>
                <span className={styles.detailsIcon}>
                  {selectedItem.thumbnail}
                </span>
                <div>
                  <h2>{selectedItem.title}</h2>
                  <p>
                    {selectedItem.type} • Added{" "}
                    {new Date(selectedItem.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.detailsContent}>
              <div className={styles.detailsSection}>
                <h3>Description</h3>
                <p>{selectedItem.description}</p>
              </div>

              <div className={styles.detailsSection}>
                <h3>Skills Demonstrated</h3>
                <div className={styles.skills}>
                  {selectedItem.skills.map((skill, index) => (
                    <span key={index} className={styles.skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedItem.feedback?.length > 0 && (
                <div className={styles.detailsSection}>
                  <h3>Feedback & Reviews</h3>
                  {selectedItem.feedback.map((fb, index) => (
                    <div key={index} className={styles.feedbackItem}>
                      <div className={styles.feedbackHeader}>
                        <span className={styles.feedbackFrom}>{fb.from}</span>
                        <span className={styles.feedbackRating}>
                          {Array(fb.rating).fill("★").join("")}
                        </span>
                      </div>
                      <p className={styles.feedbackComment}>"{fb.comment}"</p>
                      <span className={styles.feedbackDate}>
                        {new Date(fb.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedItem.verifications?.length > 0 && (
                <div className={styles.detailsSection}>
                  <h3>Verifications</h3>
                  {selectedItem.verifications.map((ver, index) => (
                    <div key={index} className={styles.verificationItem}>
                      <FiUserCheck />
                      <div>
                        <p>
                          <strong>{ver.verifier}</strong> - {ver.status}
                        </p>
                        <p className={styles.verificationDate}>
                          Verified on {new Date(ver.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedItem.badges?.length > 0 && (
                <div className={styles.detailsSection}>
                  <h3>Badges Earned</h3>
                  <div className={styles.badges}>
                    {selectedItem.badges.map((badge, index) => (
                      <span key={index} className={styles.badge}>
                        <FiAward /> {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.detailsActions}>
              <button className={styles.editBtn}>
                <FiEdit2 /> Edit
              </button>
              <button className={styles.downloadBtn}>
                <FiDownload /> Download
              </button>
              <button className={styles.deleteBtn}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

