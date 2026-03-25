// src/components/achievements/AchievementsPage.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../css/achievements.module.css";
import {
  FiAward,
  FiStar,
  FiTrendingUp,
  FiClock,
  FiCalendar,
  FiChevronRight,
  FiFilter,
  FiSearch,
  FiShare2,
  FiDownload,
  FiLock,
  FiUnlock,
  FiGift,
  FiZap,
  FiTarget,
  FiBookOpen,
  FiCheckCircle,
  FiBarChart2,
} from "react-icons/fi";

export function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Simulate loading achievements
    setTimeout(() => {
      setAchievements(mockAchievements);
      setLoading(false);
    }, 1000);
  }, []);

  const mockAchievements = [
    // Course Completion Badges
    {
      id: 1,
      name: "Network Security Master",
      description: "Completed Network Security Fundamentals with distinction",
      category: "course",
      icon: "🔒",
      rarity: "epic",
      points: 500,
      earnedDate: "2026-02-15",
      progress: 100,
      totalRequired: 1,
      isEarned: true,
      requirements: ["Complete all modules", "Score 90%+ on final exam"],
      rewards: ["500 points", "Security Expert title"],
    },
    {
      id: 2,
      name: "Web Development Pro",
      description: "Mastered React and modern web development",
      category: "course",
      icon: "⚛️",
      rarity: "rare",
      points: 350,
      earnedDate: "2026-01-20",
      progress: 100,
      totalRequired: 1,
      isEarned: true,
      requirements: ["Complete React course", "Build 3 projects"],
      rewards: ["350 points", "React Developer badge"],
    },
    {
      id: 3,
      name: "Database Expert",
      description: "Excel in Database Management Systems",
      category: "course",
      icon: "🗄️",
      rarity: "rare",
      points: 300,
      earnedDate: "2025-12-10",
      progress: 100,
      totalRequired: 1,
      isEarned: true,
      requirements: ["Complete all SQL challenges", "Design a database"],
      rewards: ["300 points", "Database Guru status"],
    },

    // Streak Badges
    {
      id: 4,
      name: "Weekly Warrior",
      description: "Maintained a 7-day learning streak",
      category: "streak",
      icon: "🔥",
      rarity: "common",
      points: 50,
      earnedDate: "2026-03-01",
      progress: 100,
      totalRequired: 7,
      isEarned: true,
      requirements: ["Learn for 7 consecutive days"],
      rewards: ["50 points", "Streak starter badge"],
    },
    {
      id: 5,
      name: "Monthly Master",
      description: "Achieved a 30-day learning streak",
      category: "streak",
      icon: "⚡",
      rarity: "rare",
      points: 200,
      earnedDate: "2026-02-28",
      progress: 100,
      totalRequired: 30,
      isEarned: true,
      requirements: ["Learn for 30 consecutive days"],
      rewards: ["200 points", "30-day streak badge"],
    },
    {
      id: 6,
      name: "Semester Champion",
      description: "Maintained a 100-day learning streak",
      category: "streak",
      icon: "🏆",
      rarity: "legendary",
      points: 1000,
      progress: 67,
      totalRequired: 100,
      isEarned: false,
      currentProgress: 67,
      requirements: ["Learn for 100 consecutive days"],
      rewards: [
        "1000 points",
        "Legendary streak badge",
        "Exclusive profile frame",
      ],
    },

    // Assessment Badges
    {
      id: 7,
      name: "Quiz Master",
      description: "Score 100% on 10 different assessments",
      category: "assessment",
      icon: "📝",
      rarity: "rare",
      points: 250,
      earnedDate: "2026-02-10",
      progress: 100,
      totalRequired: 10,
      isEarned: true,
      requirements: ["Perfect scores on 10 assessments"],
      rewards: ["250 points", "Quiz Master title"],
    },
    {
      id: 8,
      name: "Fast Learner",
      description: "Complete 5 assessments ahead of deadline",
      category: "assessment",
      icon: "🚀",
      rarity: "common",
      points: 100,
      earnedDate: "2026-01-15",
      progress: 100,
      totalRequired: 5,
      isEarned: true,
      requirements: ["Submit 5 assessments early"],
      rewards: ["100 points", "Early bird badge"],
    },
    {
      id: 9,
      name: "Perfect Score",
      description: "Achieve perfect score on a final exam",
      category: "assessment",
      icon: "💯",
      rarity: "epic",
      points: 400,
      earnedDate: "2025-12-20",
      progress: 100,
      totalRequired: 1,
      isEarned: true,
      requirements: ["Score 100% on any final exam"],
      rewards: ["400 points", "Perfect score badge"],
    },

    // Skill Badges
    {
      id: 10,
      name: "JavaScript Ninja",
      description: "Master JavaScript programming",
      category: "skill",
      icon: "🟨",
      rarity: "rare",
      points: 300,
      progress: 80,
      totalRequired: 100,
      isEarned: false,
      currentProgress: 80,
      requirements: ["Complete JavaScript track", "Pass advanced assessment"],
      rewards: ["300 points", "JavaScript expert badge"],
    },
    {
      id: 11,
      name: "Python Guru",
      description: "Become a Python programming expert",
      category: "skill",
      icon: "🐍",
      rarity: "epic",
      points: 450,
      progress: 45,
      totalRequired: 100,
      isEarned: false,
      currentProgress: 45,
      requirements: [
        "Complete Python track",
        "Build 5 projects",
        "Pass certification",
      ],
      rewards: ["450 points", "Python Guru title"],
    },
    {
      id: 12,
      name: "Security Specialist",
      description: "Master network security concepts",
      category: "skill",
      icon: "🔐",
      rarity: "legendary",
      points: 600,
      progress: 30,
      totalRequired: 100,
      isEarned: false,
      currentProgress: 30,
      requirements: [
        "Complete security track",
        "Pass certification",
        "Complete 10 scenarios",
      ],
      rewards: ["600 points", "Security Specialist badge", "Priority support"],
    },

    // Participation Badges
    {
      id: 13,
      name: "Discussion Leader",
      description: "Participate in 50 forum discussions",
      category: "participation",
      icon: "💬",
      rarity: "common",
      points: 75,
      progress: 42,
      totalRequired: 50,
      isEarned: false,
      currentProgress: 42,
      requirements: ["50 forum posts"],
      rewards: ["75 points", "Active contributor badge"],
    },
    {
      id: 14,
      name: "Peer Mentor",
      description: "Help 20 fellow students",
      category: "participation",
      icon: "🤝",
      rarity: "rare",
      points: 200,
      earnedDate: "2026-02-05",
      progress: 100,
      totalRequired: 20,
      isEarned: true,
      requirements: ["Answer 20 student questions"],
      rewards: ["200 points", "Mentor badge"],
    },

    // Special Badges
    {
      id: 15,
      name: "Early Adopter",
      description: "Join CBET Simulator in the first month",
      category: "special",
      icon: "🌟",
      rarity: "legendary",
      points: 1000,
      earnedDate: "2025-09-01",
      progress: 100,
      totalRequired: 1,
      isEarned: true,
      requirements: ["Sign up in September 2025"],
      rewards: ["1000 points", "Founder badge", "Lifetime discount"],
    },
    {
      id: 16,
      name: "Holiday Champion",
      description: "Complete challenges during holiday season",
      category: "special",
      icon: "🎄",
      rarity: "rare",
      points: 150,
      earnedDate: "2025-12-25",
      progress: 100,
      totalRequired: 1,
      isEarned: true,
      requirements: ["Complete holiday special challenge"],
      rewards: ["150 points", "Holiday badge"],
    },
  ];

  const categories = [
    { id: "all", name: "All Badges", icon: "🏆", count: achievements.length },
    {
      id: "earned",
      name: "Earned",
      icon: "✅",
      count: achievements.filter((a) => a.isEarned).length,
    },
    {
      id: "in-progress",
      name: "In Progress",
      icon: "⏳",
      count: achievements.filter((a) => !a.isEarned && a.progress > 0).length,
    },
    {
      id: "locked",
      name: "Locked",
      icon: "🔒",
      count: achievements.filter((a) => !a.isEarned && a.progress === 0).length,
    },
    {
      id: "course",
      name: "Course",
      icon: "📚",
      count: achievements.filter((a) => a.category === "course").length,
    },
    {
      id: "streak",
      name: "Streak",
      icon: "🔥",
      count: achievements.filter((a) => a.category === "streak").length,
    },
    {
      id: "assessment",
      name: "Assessment",
      icon: "📝",
      count: achievements.filter((a) => a.category === "assessment").length,
    },
    {
      id: "skill",
      name: "Skill",
      icon: "⚡",
      count: achievements.filter((a) => a.category === "skill").length,
    },
    {
      id: "participation",
      name: "Participation",
      icon: "💬",
      count: achievements.filter((a) => a.category === "participation").length,
    },
    {
      id: "special",
      name: "Special",
      icon: "🌟",
      count: achievements.filter((a) => a.category === "special").length,
    },
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return { bg: "#e2e8f0", color: "#4a5568", label: "Common" };
      case "rare":
        return { bg: "#bee3f8", color: "#2b6cb0", label: "Rare" };
      case "epic":
        return { bg: "#fef3c7", color: "#b7791f", label: "Epic" };
      case "legendary":
        return { bg: "#fed7d7", color: "#c53030", label: "Legendary" };
      default:
        return { bg: "#e2e8f0", color: "#4a5568", label: "Common" };
    }
  };

  const filteredAchievements = achievements
    .filter((achievement) => {
      if (selectedCategory === "all") return true;
      if (selectedCategory === "earned") return achievement.isEarned;
      if (selectedCategory === "in-progress")
        return !achievement.isEarned && achievement.progress > 0;
      if (selectedCategory === "locked")
        return !achievement.isEarned && achievement.progress === 0;
      return achievement.category === selectedCategory;
    })
    .filter(
      (achievement) =>
        achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        achievement.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );

  const earnedCount = achievements.filter((a) => a.isEarned).length;
  const totalPoints = achievements
    .filter((a) => a.isEarned)
    .reduce((sum, a) => sum + a.points, 0);
  const nextMilestone = achievements
    .filter((a) => !a.isEarned && a.progress > 0)
    .sort(
      (a, b) => b.progress / b.totalRequired - a.progress / a.totalRequired,
    )[0];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your achievements...</p>
      </div>
    );
  }

  return (
    <div className={styles.achievementsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Achievements</h1>
          <p className={styles.pageSubtitle}>
            Track your progress and earn badges as you learn
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.shareBtn}>
            <FiShare2 /> Share Profile
          </button>
          <button className={styles.downloadBtn}>
            <FiDownload /> Download
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
            <FiAward />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{earnedCount}</span>
            <span className={styles.statLabel}>Badges Earned</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#d1fae5", color: "#10b981" }}
          >
            <FiStar />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalPoints}</span>
            <span className={styles.statLabel}>Total Points</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fef3c7", color: "#f59e0b" }}
          >
            <FiTrendingUp />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {achievements.length - earnedCount}
            </span>
            <span className={styles.statLabel}>Available</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fae8ff", color: "#8b5cf6" }}
          >
            <FiTarget />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {Math.round((earnedCount / achievements.length) * 100)}%
            </span>
            <span className={styles.statLabel}>Completion</span>
          </div>
        </div>
      </div>

      {/* Next Milestone */}
      {nextMilestone && (
        <div className={styles.nextMilestone}>
          <div className={styles.milestoneHeader}>
            <FiZap className={styles.milestoneIcon} />
            <span>Next Milestone</span>
          </div>
          <div className={styles.milestoneContent}>
            <div className={styles.milestoneInfo}>
              <span className={styles.milestoneName}>{nextMilestone.name}</span>
              <span className={styles.milestoneProgress}>
                {nextMilestone.currentProgress}/{nextMilestone.totalRequired}
              </span>
            </div>
            <div className={styles.milestoneBar}>
              <div
                className={styles.milestoneFill}
                style={{ width: `${nextMilestone.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button
          className={`${styles.filterBtn} ${showFilters ? styles.active : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> Filter
        </button>
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

      {/* Achievements Grid */}
      <div className={styles.achievementsGrid}>
        {filteredAchievements.map((achievement) => {
          const rarity = getRarityColor(achievement.rarity);
          return (
            <div
              key={achievement.id}
              className={`${styles.achievementCard} ${!achievement.isEarned ? styles.locked : ""}`}
            >
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div
                  className={styles.badgeIcon}
                  style={{ background: rarity.bg, color: rarity.color }}
                >
                  {achievement.icon}
                </div>
                <div className={styles.badgeInfo}>
                  <h3 className={styles.badgeName}>{achievement.name}</h3>
                  <span
                    className={styles.badgeRarity}
                    style={{ background: rarity.bg, color: rarity.color }}
                  >
                    {rarity.label}
                  </span>
                </div>
                {achievement.isEarned ? (
                  <FiUnlock
                    className={styles.unlockIcon}
                    style={{ color: "#10b981" }}
                  />
                ) : (
                  <FiLock
                    className={styles.lockIcon}
                    style={{ color: "#a0aec0" }}
                  />
                )}
              </div>

              {/* Description */}
              <p className={styles.badgeDescription}>
                {achievement.description}
              </p>

              {/* Progress Bar (if in progress) */}
              {!achievement.isEarned && achievement.progress > 0 && (
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>Progress</span>
                    <span className={styles.progressPercentage}>
                      {achievement.currentProgress}/{achievement.totalRequired}
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${achievement.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className={styles.requirements}>
                <p className={styles.requirementsTitle}>Requirements:</p>
                <ul className={styles.requirementsList}>
                  {achievement.requirements.map((req, index) => (
                    <li key={index}>
                      <FiCheckCircle className={styles.reqIcon} />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rewards */}
              <div className={styles.rewards}>
                <p className={styles.rewardsTitle}>Rewards:</p>
                <div className={styles.rewardsList}>
                  {achievement.rewards.map((reward, index) => (
                    <span key={index} className={styles.reward}>
                      <FiGift /> {reward}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className={styles.cardFooter}>
                <div className={styles.points}>
                  <FiStar /> {achievement.points} pts
                </div>
                {achievement.isEarned && (
                  <div className={styles.earnedDate}>
                    <FiCalendar /> Earned:{" "}
                    {new Date(achievement.earnedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className={styles.emptyState}>
          <FiAward className={styles.emptyIcon} />
          <h3>No achievements found</h3>
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
    </div>
  );
}
