import React, { createContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./sidebar.jsx";

export const CourseContext = createContext({});
export const StudentDataContext = createContext({
  loading: true,
  studentProfile: null,
  coursesData: {},
  assessments: [],
  portfolioItems: [],
  notifications: [],
  recentActivities: [],
  upcomingAssessments: [],
  achievements: [],
  stats: {},
});

const clearStoredAuthData = () => {
  localStorage.removeItem("cbet_user");
  localStorage.removeItem("token");
  localStorage.removeItem("admin_user");
  sessionStorage.removeItem("cbet_user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("admin_user");
};

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("cbet_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

const getStoredTheme = () => {
  const savedTheme = localStorage.getItem("cbet_theme");
  return savedTheme === "dark" ? "dark" : "light";
};

const buildAchievements = ({
  totalCourses,
  completedCourses,
  assessments,
  portfolioItems,
}) => {
  const completedAssessments = assessments.filter((item) => item.score !== null);
  const verifiedItems = portfolioItems.filter(
    (item) => item.verifications?.length > 0,
  );
  const earnedBadges = portfolioItems.flatMap((item) => item.badges || []);
  const latestAssessmentDate =
    completedAssessments[0]?.completedDate || completedAssessments[0]?.date || null;
  const latestPortfolioDate = portfolioItems[0]?.date || null;

  return [
    {
      id: "course-progress",
      name: "Course Progress",
      description: "Complete the units assigned to your current programme.",
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
      requirements: ["Complete assigned courses"],
      rewards: ["Programme progress recognition"],
      earnedDate: completedCourses > 0 ? latestPortfolioDate || latestAssessmentDate : null,
    },
    {
      id: "assessment-momentum",
      name: "Assessment Momentum",
      description: "Submit assessments and maintain steady learning progress.",
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
      requirements: ["Complete assigned assessments"],
      rewards: ["Assessment consistency badge"],
      earnedDate: completedAssessments.length > 0 ? latestAssessmentDate : null,
    },
    {
      id: "portfolio-builder",
      name: "Portfolio Builder",
      description: "Upload and verify portfolio evidence from your completed work.",
      category: "skill",
      icon: "PF",
      rarity: verifiedItems.length >= 3 ? "rare" : "common",
      points: portfolioItems.reduce((sum, item) => sum + (item.points || 0), 0),
      progress: Math.min(100, verifiedItems.length * 25),
      totalRequired: 4,
      currentProgress: verifiedItems.length,
      isEarned: verifiedItems.length > 0,
      requirements: ["Earn verified portfolio items"],
      rewards: ["Evidence-ready learner badge"],
      earnedDate: verifiedItems.length > 0 ? latestPortfolioDate : null,
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
      rewards: ["Recognition in your student profile"],
      earnedDate: earnedBadges.length > 0 ? latestPortfolioDate : null,
    },
  ];
};

export function Dashboard({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [courses, setCourses] = useState({});
  const [themeMode, setThemeMode] = useState(getStoredTheme);
  const [studentData, setStudentData] = useState({
    loading: true,
    studentProfile: null,
    coursesData: {},
    assessments: [],
    portfolioItems: [],
    notifications: [],
    recentActivities: [],
    upcomingAssessments: [],
    achievements: [],
    stats: {},
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const localData = readStoredUser();
      const authResponse = await fetch("http://localhost:8000/auth/user/check/logged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const studentInfo = await authResponse.json();

      if (!authResponse.ok || !localData || studentInfo.role !== "student") {
        clearStoredAuthData();
        navigate("/login");
        return;
      }

      navigate("/dashboard");

      try {
        const [
          coursesResponse,
          assessmentsResponse,
          portfolioResponse,
          notificationsResponse,
        ] = await Promise.all([
          fetch("http://localhost:8000/auth/admin/upload/courses/my/courses", {
            method: "POST",
            credentials: "include",
          }),
          fetch(
            "http://localhost:8000/api/resources/upload/users/data/pdf/student?activityType=assessment",
            {
              method: "GET",
              credentials: "include",
            },
          ),
          fetch(
            "http://localhost:8000/api/resources/upload/users/data/pdf/student/portfolio",
            {
              method: "GET",
              credentials: "include",
            },
          ),
          fetch("http://localhost:8000/api/public/notifications", {
            method: "GET",
            credentials: "include",
          }),
        ]);

        const coursesData = coursesResponse.ok ? await coursesResponse.json() : {};
        const assessmentsData = assessmentsResponse.ok
          ? await assessmentsResponse.json()
          : {};
        const portfolioData = portfolioResponse.ok ? await portfolioResponse.json() : {};
        const notificationsData = notificationsResponse.ok
          ? await notificationsResponse.json()
          : {};

        const assessments =
          assessmentsData.assessments || assessmentsData.simulations || [];
        const portfolioItems = portfolioData.portfolioItems || [];
        const notifications = (notificationsData.data || []).slice(0, 5).map((item, index) => ({
          id: index + 1,
          message: item.title ? `${item.title}: ${item.content}` : item.content,
          time: item.time || "Recently",
          read: index > 1,
        }));
        const totalCourses =
          Array.isArray(coursesData.count) && coursesData.count.length > 0
            ? coursesData.count[0].count
            : 0;
        const completedCourses =
          Array.isArray(coursesData.completedCourses) &&
          coursesData.completedCourses.length > 0
            ? coursesData.completedCourses[0].count
            : 0;
        const completedAssessments = assessments.filter((item) => item.score !== null);
        const pendingAssessments = assessments.filter((item) => item.score === null);
        const totalAssessmentPoints = completedAssessments.reduce(
          (sum, item) => sum + (item.score || 0),
          0,
        );
        const averageScore = completedAssessments.length
          ? Math.round(
              completedAssessments.reduce(
                (sum, item) => sum + (item.percentage || 0),
                0,
              ) / completedAssessments.length,
            )
          : 0;
        const badgesEarned = portfolioItems.reduce(
          (sum, item) => sum + (item.badges?.length || 0),
          0,
        );
        const achievements = buildAchievements({
          totalCourses,
          completedCourses,
          assessments,
          portfolioItems,
        });

        setCourses(coursesData);
        setStudentData({
          loading: false,
          studentProfile:
            portfolioData.student || {
              fullName: studentInfo.fullName,
              userNumber: studentInfo.userNumber,
              programme: localData?.programme || "",
              yearOfStudy: 1,
            },
          coursesData,
          assessments,
          portfolioItems,
          notifications,
          recentActivities: completedAssessments.slice(0, 4).map((item, index) => ({
            id: item.id || index,
            title: `${item.title || "Assessment"} completed with ${item.percentage || 0}%`,
            time: item.completedDate
              ? new Date(item.completedDate).toLocaleString()
              : "Recently",
            color: "#2563eb",
          })),
          upcomingAssessments: pendingAssessments.slice(0, 4).map((item, index) => ({
            id: item.id || index,
            title: item.title || "Pending assessment",
            course: item.category || item.activityType || "Assessment",
            dueDate: item.deadline
              ? new Date(item.deadline).toLocaleDateString()
              : "Awaiting deadline",
            priority: item.deadline ? "high" : "low",
          })),
          achievements,
          stats: {
            totalCourses,
            completedCourses,
            coursesInProgress: Math.max(totalCourses - completedCourses, 0),
            pendingAssessments: pendingAssessments.length,
            averageScore,
            totalPoints:
              totalAssessmentPoints +
              portfolioItems.reduce((sum, item) => sum + (item.points || 0), 0),
            currentRank:
              averageScore >= 85 ? "Gold" : averageScore >= 70 ? "Silver" : "Starter",
            streakDays: completedAssessments.length,
            badgesEarned,
            verifiedItems: portfolioItems.filter((item) => item.verifications?.length > 0)
              .length,
            completionRate: assessments.length
              ? Math.round((completedAssessments.length / assessments.length) * 100)
              : 0,
          },
        });
      } catch (error) {
        setStudentData((current) => ({ ...current, loading: false }));
      }
    }

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    localStorage.setItem("cbet_theme", themeMode);
  }, [themeMode]);

  const contextValue = useMemo(
    () => ({
      ...studentData,
      coursesData: courses,
    }),
    [studentData, courses],
  );

  return (
    <div className="dashboard">
      <Sidebar
        collapsed={collapsed}
        coursesInfo={courses}
        studentData={contextValue}
        onToggle={() => setCollapsed((current) => !current)}
        themeMode={themeMode}
        onToggleTheme={() =>
          setThemeMode((currentTheme) =>
            currentTheme === "dark" ? "light" : "dark",
          )
        }
      />

      <div
        className="dashboard-content"
        style={{
          marginLeft: collapsed ? "80px" : "280px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          background:
            themeMode === "dark"
              ? "linear-gradient(180deg, #020617 0%, #0f172a 100%)"
              : "#f8fafc",
        }}
      >
        <CourseContext.Provider value={courses}>
          <StudentDataContext.Provider value={contextValue}>
            {children}
          </StudentDataContext.Provider>
        </CourseContext.Provider>
      </div>
    </div>
  );
}
