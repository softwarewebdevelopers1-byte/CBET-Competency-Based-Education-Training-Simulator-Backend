import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  Users,
} from "lucide-react";
import styles from "../../admin/styles/dashboard.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8000";

const TrainerDashboard = () => {
  const [items, setItems] = useState([]);
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadTrainerContent = async () => {
      try {
        setLoading(true);
        setError("");

        const [assessmentResponse, unitsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/resources/assessments/admin?ownership=self`, {
            method: "GET",
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/auth/admin/upload/courses/trainer/assigned-units`, {
            method: "GET",
            credentials: "include",
          }),
        ]);

        const assessmentData = await assessmentResponse.json();
        const unitsData = await unitsResponse.json();

        if (!assessmentResponse.ok) {
          throw new Error(
            assessmentData.error || "Unable to fetch trainer content",
          );
        }

        if (!unitsResponse.ok) {
          throw new Error(
            unitsData.message || unitsData.error || "Unable to fetch assigned units",
          );
        }

        setItems(assessmentData.assessments || assessmentData.simulations || []);
        setAssignedUnits(unitsData.units || []);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to fetch trainer content",
        );
        setItems([]);
        setAssignedUnits([]);
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
    const traineeTotal = assignedUnits.reduce(
      (sum, unit) => sum + (unit.traineeCount || 0),
      0,
    );

    return {
      total: items.length,
      assessments: assessments.length,
      active: items.filter((item) => item.status?.toLowerCase() === "active").length,
      assignedUnits: assignedUnits.length,
      trainees: traineeTotal,
    };
  }, [items, assignedUnits]);

  const stats = [
    {
      icon: ClipboardCheck,
      label: "My Content",
      value: metrics.total,
      helper: "Assessments and scenarios you created",
      color: "blue",
    },
    {
      icon: FileText,
      label: "Assessments",
      value: metrics.assessments,
      helper: "AI-generated assessments",
      color: "green",
    },
    {
      icon: BookOpen,
      label: "Assigned Units",
      value: metrics.assignedUnits,
      helper: "Units linked to you by admin",
      color: "red",
    },
    {
      icon: Users,
      label: "Assigned Trainees",
      value: metrics.trainees,
      helper: "Learners attached to your units",
      color: "blue",
    },
  ];

  return (
    <div className={`${styles.dashboard} ${loading ? styles.loading : ""}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Trainer Dashboard</h1>
          <p className={styles.pageSubtitle}>
            See your assigned units and the trainees linked to each one.
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
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <h3>Assigned Units</h3>
            <p>Units where you are the assigned lecturer.</p>
          </div>

          {assignedUnits.length > 0 ? (
            <div className={styles.listStack}>
              {assignedUnits.map((unit) => (
                <article key={unit._id} className={styles.activityCard}>
                  <div className={styles.activityCardHeader}>
                    <div>
                      <h4 className={styles.activityTitle}>
                        {unit.unitCode} - {unit.unitName}
                      </h4>
                      <p className={styles.activityMeta}>
                        {unit.courseTitle} • {unit.department} • Year {unit.yearOfStudy}
                      </p>
                    </div>
                    <span className={styles.statusBadge}>
                      {unit.traineeCount || 0} trainee{unit.traineeCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className={styles.activityContent}>
                    <strong>Students in this unit</strong>
                    {unit.trainees?.length > 0 ? (
                      <ul className={styles.compactList}>
                        {unit.trainees.map((trainee) => (
                          <li key={trainee.userNumber}>
                            {trainee.fullName} ({trainee.userNumber})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.emptyStateText}>
                        No trainees have been assigned to this unit yet.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyStateText}>
              No units have been assigned to you yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default TrainerDashboard;
