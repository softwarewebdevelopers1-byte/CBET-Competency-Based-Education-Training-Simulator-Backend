import React, { useEffect, useMemo, useState } from "react";
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

const buildAchievements = ({
  totalCourses,
  completedCourses,
  assessments,
  portfolioItems,
}) => {
  const completedAssessments = assessments.filter((item) => item.score !== null);
  const verifiedItems = portfolioItems.filter(
    (item) => item.verifications?.length > 0,
  ).length;
  const earnedBadges = portfolioItems.flatMap((item) => item.badges || []);
  const totalPortfolioPoints = portfolioItems.reduce(
    (sum, item) => sum + (item.points || 0),
    0,
  );
  const latestAssessmentDate =
    completedAssessments[0]?.completedDate || completedAssessments[0]?.date || null;
  const latestPortfolioDate = portfolioItems[0]?.date || null;

  return [
    {
      id: "active-course-progress",
      name: "Course Progress",
      description: "Track the courses you are currently taking and the ones you have completed.",
      category: "course",
      icon: "CR",
      rarity: completedCourses >= 3 ? "rare" : "common",
      points: completedCourses * 100,
      progress: totalCourses
        ? Math.round((completedCourses / totalCourses) * 100)
        : 0,
      totalRequired: Math.max(totalCourses, 1),
      currentProgress: completedCourses,
      isEarned: completedCourses > 0,
      requirements: ["Complete enrolled courses"],
      rewards: ["Course completion recognition"],
      earnedDate: latestPortfolioDate || latestAssessmentDate,
    },
    {
      id: "assessment-momentum",
      name: "Assessment Momentum",
      description: "Build momentum by completing assigned assessments.",
      category: "assessment",
      icon: "AS",
      rarity: completedAssessments.length >= 5 ? "epic" : "common",
      points: completedAssessments.reduce((sum, item) => sum + (item.score || 0), 0),
      progress: assessments.length
        ? Math.round((completedAssessments.length / assessments.length) * 100)
        : 0,
      totalRequired: Math.max(assessments.length, 1),
      currentProgress: completedAssessments.length,
      isEarned: completedAssessments.length > 0,
      requirements: ["Submit assigned assessments"],
      rewards: ["Consistency badge"],
      earnedDate: latestAssessmentDate,
    },
    {
      id: "portfolio-builder",
      name: "Portfolio Builder",
      description: "Add verified evidence from completed work into your portfolio.",
      category: "skill",
      icon: "PF",
      rarity: verifiedItems >= 3 ? "rare" : "common",
      points: totalPortfolioPoints,
      progress: Math.min(100, verifiedItems * 25),
      totalRequired: 4,
      currentProgress: verifiedItems,
      isEarned: verifiedItems > 0,
      requirements: ["Earn verified portfolio items"],
      rewards: ["Evidence-ready learner badge"],
      earnedDate: latestPortfolioDate,
    },
    {
      id: "badge-collector",
      name: "Badge Collector",
      description: "Collect badges from approved and verified portfolio work.",
      category: "special",
      icon: "BG",
      rarity: earnedBadges.length >= 5 ? "legendary" : "common",
      points: earnedBadges.length * 50,
      progress: Math.min(100, earnedBadges.length * 20),
      totalRequired: 5,
      currentProgress: earnedBadges.length,
      isEarned: earnedBadges.length > 0,
      requirements: ["Earn portfolio badges"],
      rewards: ["Profile recognition"],
      earnedDate: latestPortfolioDate,
    },
  ];
};

export function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [courseStats, setCourseStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    activeCourses: 0,
  });

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true);

        const [coursesResponse, assessmentsResponse, portfolioResponse] =
          await Promise.all([
            fetch(
              "https://cbet-competency-based-education-training.onrender.com/auth/admin/upload/courses/my/courses",
              {
                method: "POST",
                credentials: "include",
              },
            ),
            fetch(
              "https://cbet-competency-based-education-training.onrender.com/api/resources/upload/users/data/pdf/student?activityType=assessment",
              {
                method: "GET",
                credentials: "include",
              },
            ),
            fetch(
              "https://cbet-competency-based-education-training.onrender.com/api/resources/upload/users/data/pdf/student/portfolio",
              {
                method: "GET",
                credentials: "include",
              },
            ),
          ]);

        const coursesData = coursesResponse.ok ? await coursesResponse.json() : {};
        const assessmentsData = assessmentsResponse.ok
          ? await assessmentsResponse.json()
          : {};
        const portfolioData = portfolioResponse.ok ? await portfolioResponse.json() : {};

        const totalCourses =
          Array.isArray(coursesData.count) && coursesData.count.length > 0
            ? coursesData.count[0]?.count || 0
            : Array.isArray(coursesData.courses)
              ? coursesData.courses.length
              : 0;
        const completedCourses =
          Array.isArray(coursesData.completedCourses) &&
          coursesData.completedCourses.length > 0
            ? coursesData.completedCourses[0]?.count || 0
            : 0;
        const assessments =
          assessmentsData.assessments || assessmentsData.simulations || [];
        const portfolioItems = portfolioData.portfolioItems || [];

        setCourseStats({
          totalCourses,
          completedCourses,
          activeCourses: Math.max(totalCourses - completedCourses, 0),
        });
        setAchievements(
          buildAchievements({
            totalCourses,
            completedCourses,
            assessments,
            portfolioItems,
          }),
        );
      } catch (error) {
        setAchievements([]);
        setCourseStats({
          totalCourses: 0,
          completedCourses: 0,
          activeCourses: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, []);

  const categories = useMemo(
    () => [
      { id: "all", name: "All Badges", icon: "ALL", count: achievements.length },
      {
        id: "earned",
        name: "Earned",
        icon: "OK",
        count: achievements.filter((item) => item.isEarned).length,
      },
      {
        id: "in-progress",
        name: "In Progress",
        icon: "IP",
        count: achievements.filter((item) => !item.isEarned && item.progress > 0).length,
      },
      {
        id: "course",
        name: "Course",
        icon: "CR",
        count: achievements.filter((item) => item.category === "course").length,
      },
      {
        id: "assessment",
        name: "Assessment",
        icon: "AS",
        count: achievements.filter((item) => item.category === "assessment").length,
      },
      {
        id: "skill",
        name: "Skill",
        icon: "SK",
        count: achievements.filter((item) => item.category === "skill").length,
      },
      {
        id: "special",
        name: "Special",
        icon: "SP",
        count: achievements.filter((item) => item.category === "special").length,
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
      return achievement.category === selectedCategory;
    })
    .filter((achievement) => {
      const text = `${achievement.name} ${achievement.description}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });

  const earnedCount = achievements.filter((item) => item.isEarned).length;
  const totalPoints = achievements
    .filter((item) => item.isEarned)
    .reduce((sum, item) => sum + item.points, 0);
  const nextMilestone = achievements
    .filter((item) => !item.isEarned && item.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];
  const completionPercent = achievements.length
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
            Real progress from your active courses, completed courses, assessments, and portfolio
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
            <FiTarget />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{courseStats.activeCourses}</span>
            <span className={styles.statLabel}>Active Courses</span>
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
            <span className={styles.statValue}>{courseStats.completedCourses}</span>
            <span className={styles.statLabel}>Completed Courses</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fef3c7", color: "#f59e0b" }}
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
            style={{ background: "#fae8ff", color: "#8b5cf6" }}
          >
            <FiTrendingUp />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{completionPercent}%</span>
            <span className={styles.statLabel}>Achievement Completion</span>
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

      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#eef2ff", color: "#4338ca" }}
          >
            <FiStar />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalPoints}</span>
            <span className={styles.statLabel}>Reward Points</span>
          </div>
        </div>
      </div>
    </div>
  );
}
