import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardCheck, ListChecks } from "lucide-react";
import styles from "../../admin/styles/dashboard.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://cbet-competency-based-education-training.onrender.com";

const TrainerDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadTrainerContent = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `${API_BASE_URL}/api/resources/assessments/admin?ownership=self`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to fetch trainer content");
        }

        setItems(data.assessments || data.simulations || []);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to fetch trainer content",
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrainerContent();
  }, []);

  const metrics = useMemo(() => {
    const assessments = items.filter(
      (item) => (item.activityType || "assessment") === "assessment",
    );

    return {
      total: items.length,
      assessments: assessments.length,
      active: items.filter((item) => item.status?.toLowerCase() === "active").length,
    };
  }, [items]);

  const stats = [
    {
      icon: ClipboardCheck,
      label: "My Content",
      value: metrics.total,
      helper: "Assessments and scenarios you created",
      color: "blue",
    },
    {
      icon: ListChecks,
      label: "Assessments",
      value: metrics.assessments,
      helper: "AI-generated assessments",
      color: "green",
    },
    {
      icon: ClipboardCheck,
      label: "Active",
      value: metrics.active,
      helper: "Currently visible to students",
      color: "red",
    },
  ];

  return (
    <div className={`${styles.dashboard} ${loading ? styles.loading : ""}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Trainer Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Create and manage the assessments assigned to your learners.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={`${styles.statCard} ${styles[stat.color]}`}>
            <div className={styles.statIcon}>
              <stat.icon size={22} />
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statHelper}>{stat.helper}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionButtons}>
          <button
            className={styles.actionBtn}
            onClick={() => navigate("/trainer/assessments")}
          >
            Create Assessment
            <ArrowRight size={18} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => navigate("/trainer/units")}
          >
            View Assigned Units
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
