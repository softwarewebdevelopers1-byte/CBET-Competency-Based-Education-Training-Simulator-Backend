import React, { useContext, useMemo, useState } from "react";
import styles from "../css/achievements.module.css";
import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiFilter,
  FiGift,
  FiLock,
  FiSearch,
  FiShare2,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiUnlock,
  FiZap,
} from "react-icons/fi";
import { StudentDataContext } from "./dashboard";

export function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { loading, achievements = [] } = useContext(StudentDataContext);

  const categories = useMemo(
    () => [
      { id: "all", name: "All Badges", icon: "ALL", count: achievements.length },
      {
        id: "earned",
        name: "Earned",
        icon: "OK",
        count: achievements.filter((a) => a.isEarned).length,
      },
      {
        id: "in-progress",
        name: "In Progress",
        icon: "IP",
        count: achievements.filter((a) => !a.isEarned && a.progress > 0).length,
      },
      {
        id: "locked",
        name: "Locked",
        icon: "LK",
        count: achievements.filter((a) => !a.isEarned && a.progress === 0).length,
      },
      {
        id: "course",
        name: "Course",
        icon: "CR",
        count: achievements.filter((a) => a.category === "course").length,
      },
      {
        id: "assessment",
        name: "Assessment",
        icon: "AS",
        count: achievements.filter((a) => a.category === "assessment").length,
      },
      {
        id: "skill",
        name: "Skill",
        icon: "SK",
        count: achievements.filter((a) => a.category === "skill").length,
      },
      {
        id: "special",
        name: "Special",
        icon: "SP",
        count: achievements.filter((a) => a.category === "special").length,
      },
    ],
    [achievements],
  );

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
      if (selectedCategory === "in-progress") {
        return !achievement.isEarned && achievement.progress > 0;
      }
      if (selectedCategory === "locked") {
        return !achievement.isEarned && achievement.progress === 0;
      }
      return achievement.category === selectedCategory;
    })
    .filter((achievement) => {
      const searchableText =
        `${achievement.name} ${achievement.description}`.toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });

  const earnedCount = achievements.filter((achievement) => achievement.isEarned).length;
  const totalPoints = achievements
    .filter((achievement) => achievement.isEarned)
    .reduce((sum, achievement) => sum + achievement.points, 0);
  const nextMilestone = achievements
    .filter((achievement) => !achievement.isEarned && achievement.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];
  const completion = achievements.length
    ? Math.round((earnedCount / achievements.length) * 100)
    : 0;

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
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Achievements</h1>
          <p className={styles.pageSubtitle}>
            Real progress badges generated from your courses, assessments, and portfolio activity
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.shareBtn} type="button">
            <FiShare2 /> Share Profile
          </button>
          <button className={styles.downloadBtn} type="button">
            <FiDownload /> Download
          </button>
        </div>
      </div>

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
              {Math.max(achievements.length - earnedCount, 0)}
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
            <span className={styles.statValue}>{completion}%</span>
            <span className={styles.statLabel}>Completion</span>
          </div>
        </div>
      </div>

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

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button
          className={`${styles.filterBtn} ${showFilters ? styles.active : ""}`}
          onClick={() => setShowFilters(!showFilters)}
          type="button"
        >
          <FiFilter /> Filter
        </button>
      </div>

      <div className={styles.categories}>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.categoryBtn} ${selectedCategory === category.id ? styles.activeCategory : ""}`}
            onClick={() => setSelectedCategory(category.id)}
            type="button"
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
            <span className={styles.categoryCount}>{category.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.achievementsGrid}>
        {filteredAchievements.map((achievement) => {
          const rarity = getRarityColor(achievement.rarity);

          return (
            <div
              key={achievement.id}
              className={`${styles.achievementCard} ${!achievement.isEarned ? styles.locked : ""}`}
            >
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

              <p className={styles.badgeDescription}>{achievement.description}</p>

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

              <div className={styles.requirements}>
                <p className={styles.requirementsTitle}>Requirements:</p>
                <ul className={styles.requirementsList}>
                  {achievement.requirements.map((requirement) => (
                    <li key={requirement}>
                      <FiCheckCircle className={styles.reqIcon} />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.rewards}>
                <p className={styles.rewardsTitle}>Rewards:</p>
                <div className={styles.rewardsList}>
                  {achievement.rewards.map((reward) => (
                    <span key={reward} className={styles.reward}>
                      <FiGift /> {reward}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.points}>
                  <FiStar /> {achievement.points} pts
                </div>
                {achievement.isEarned && achievement.earnedDate && (
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
            type="button"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
