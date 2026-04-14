import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Users } from "lucide-react";
import styles from "../../admin/styles/dashboard.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://cbet-competency-based-education-training.onrender.com";

const AssignedUnits = () => {
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAssignedUnits = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/auth/admin/upload/courses/trainer/assigned-units`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Unable to fetch assigned units",
          );
        }

        setAssignedUnits(data.units || []);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to fetch assigned units",
        );
        setAssignedUnits([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignedUnits();
  }, []);

  const traineeTotal = useMemo(
    () =>
      assignedUnits.reduce(
        (sum, unit) => sum + (unit.traineeCount || 0),
        0,
      ),
    [assignedUnits],
  );

  return (
    <div className={`${styles.dashboard} ${loading ? styles.loading : ""}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Assigned Units</h1>
          <p className={styles.pageSubtitle}>
            View your assigned units and the students who registered for each one.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.red}`}>
          <div className={styles.statIcon}>
            <BookOpen size={22} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statLabel}>Assigned Units</span>
            <span className={styles.statValue}>{assignedUnits.length}</span>
            <span className={styles.statHelper}>Units linked to you by admin</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.blue}`}>
          <div className={styles.statIcon}>
            <Users size={22} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statLabel}>Students</span>
            <span className={styles.statValue}>{traineeTotal}</span>
            <span className={styles.statHelper}>Students across all your assigned units</span>
          </div>
        </div>
      </div>

      <div className={styles.dataCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Unit Roster</h3>
            <p>Each assigned unit and the students attached to it.</p>
          </div>
        </div>

        {assignedUnits.length > 0 ? (
          <div className={styles.userList}>
            {assignedUnits.map((unit) => (
              <div key={unit._id} className={styles.userListItem}>
                <div className={styles.userAvatar}>{unit.unitCode?.slice(0, 2) || "UN"}</div>
                <div className={styles.userListContent}>
                  <span className={styles.userListName}>
                    {unit.unitCode} - {unit.unitName}
                  </span>
                  <span className={styles.userListMeta}>
                    {unit.courseTitle} • {unit.department} • Year {unit.yearOfStudy}
                  </span>
                  <span className={styles.userListMeta}>
                    {unit.traineeCount || 0} student{unit.traineeCount === 1 ? "" : "s"} assigned
                  </span>
                  {unit.trainees?.length > 0 ? (
                    unit.trainees.map((trainee) => (
                      <span key={trainee.userNumber} className={styles.userListMeta}>
                        {trainee.fullName} ({trainee.userNumber})
                        {trainee.registeredAt
                          ? ` • Registered ${new Date(trainee.registeredAt).toLocaleDateString()}`
                          : ""}
                      </span>
                    ))
                  ) : (
                    <span className={styles.userListMeta}>
                      No students registered yet
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.placeholderBox}>
            No assigned units found for your account yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedUnits;
