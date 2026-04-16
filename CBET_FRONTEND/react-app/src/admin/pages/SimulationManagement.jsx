import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Upload,
  Eye,
  Filter,
  Gamepad2,
  FileText,
  RefreshCw,
  Power,
  Trash2,
} from "lucide-react";
import styles from "../styles/simulationManagement.module.css";

const initialForm = {
  courseTitle: "",
  unitSubtitle: "",
  unitCode: "",
  assignedProgramme: "",
  assignedDepartment: "",
  yearOfStudy: 1,
  questionCount: 8,
  description: "",
  instructions: "",
  file: null,
};

const programmeOptions = [
  "Bsc in Informatics",
  "Bsc in Computer science",
];

const formatDate = (value) => {
  if (!value) return "Just now";
  return new Date(value).toLocaleString();
};

const buildLabels = (activityType) => {
  if (activityType === "scenario") {
    return {
      title: "Interactive Scenario Management",
      singular: "scenario",
      plural: "scenarios",
      create: "Create Scenario",
      empty: "Upload a PDF to generate the first interactive scenario for students.",
      description:
        "Upload unit PDFs, generate AI questions, and assign interactive scenarios to students.",
      icon: Gamepad2,
    };
  }

  return {
    title: "Assessment Management",
    singular: "assessment",
    plural: "assessments",
    create: "Create Assessment",
    empty: "Upload a PDF to generate the first AI assessment for students.",
    description:
      "Upload unit PDFs, generate AI questions, and assign assessments to students.",
    icon: FileText,
  };
};

const SimulationManagement = ({
  activityType = "scenario",
  ownership = "all",
  pageTitle,
  pageDescription,
}) => {
  const labels = buildLabels(activityType);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState(initialForm);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadItems = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const query = new URLSearchParams({
        activityType,
        ownership,
      });
      const response = await fetch(
        `https://cbet-competency-based-education-training.onrender.com/api/resources/assessments/admin?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Unable to load ${labels.plural}`,
        );
      }

      setItems(data.assessments || data.simulations || []);
    } catch (error) {
      setErrorMessage(error.message || `Unable to load ${labels.plural}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [activityType, ownership]);

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handleCreateItem = async (event) => {
    event.preventDefault();
    setUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = new FormData();
      Object.entries({
        ...formData,
        activityType,
      }).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          payload.append(key, value);
        }
      });

      const response = await fetch("https://cbet-competency-based-education-training.onrender.com/api/resources/assessments", {
        method: "POST",
        credentials: "include",
        body: payload,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to create ${labels.singular}`);
      }

      setSuccessMessage(data.message || `${labels.create} generated successfully`);
      setFormData(initialForm);
      setShowCreateForm(false);
      await loadItems();
    } catch (error) {
      setErrorMessage(error.message || `Unable to create ${labels.singular}`);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus =
      item.status?.toLowerCase() === "active" ? "inactive" : "active";

    try {
      setStatusUpdatingId(item.id);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `https://cbet-competency-based-education-training.onrender.com/api/resources/assessments/admin/${item.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to update ${labels.singular} status`);
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: nextStatus,
                updatedAt:
                  data.assessment?.updatedAt ||
                  data.simulation?.updatedAt ||
                  entry.updatedAt,
              }
            : entry,
        ),
      );
      setSuccessMessage(
        data.message ||
          `${labels.singular} ${
            nextStatus === "active" ? "activated" : "deactivated"
          } successfully`,
      );
    } catch (error) {
      setErrorMessage(
        error.message || `Unable to update ${labels.singular} status`,
      );
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handleDeleteItem = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title}" and all related student attempts? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(item.id);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `https://cbet-competency-based-education-training.onrender.com/api/resources/assessments/admin/${item.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to delete ${labels.singular}`);
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setSuccessMessage(
        data.message || `${labels.singular} and related records deleted successfully`,
      );
    } catch (error) {
      setErrorMessage(error.message || `Unable to delete ${labels.singular}`);
    } finally {
      setDeletingId("");
    }
  };

  const filteredItems = useMemo(() => {
    if (filterType === "all") {
      return items;
    }

    return items.filter(
      (entry) =>
        entry.status?.toLowerCase() === filterType ||
        entry.courseTitle?.toLowerCase().includes(filterType),
    );
  }, [filterType, items]);

  const PageIcon = labels.icon;

  return (
    <div className={styles.simulationManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>{pageTitle || labels.title}</h1>
          <p className={styles.pageDescription}>
            {pageDescription || labels.description}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryBtn}
            onClick={() =>
              setFilterType((current) => (current === "all" ? "active" : "all"))
            }
            type="button"
          >
            <Filter size={20} />
            {filterType === "all" ? "Show Active" : "Show All"}
          </button>
          <button className={styles.secondaryBtn} onClick={loadItems} type="button">
            <RefreshCw size={20} />
            Refresh
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => setShowCreateForm((current) => !current)}
            type="button"
          >
            <Plus size={20} />
            {showCreateForm ? "Close Form" : labels.create}
          </button>
        </div>
      </div>

      {errorMessage ? <div className={styles.alertError}>{errorMessage}</div> : null}
      {successMessage ? (
        <div className={styles.alertSuccess}>{successMessage}</div>
      ) : null}

      {showCreateForm ? (
        <form className={styles.uploadPanel} onSubmit={handleCreateItem}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Programme</span>
              <select
                name="assignedProgramme"
                value={formData.assignedProgramme}
                onChange={handleInputChange}
                required
              >
                <option value="">Select programme</option>
                {programmeOptions.map((programme) => (
                  <option key={programme} value={programme}>
                    {programme}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Department</span>
              <input
                name="assignedDepartment"
                value={formData.assignedDepartment}
                onChange={handleInputChange}
              />
            </label>
            <label className={styles.field}>
              <span>Course Title</span>
              <input
                name="courseTitle"
                value={formData.courseTitle}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Unit Subtitle</span>
              <input
                name="unitSubtitle"
                value={formData.unitSubtitle}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Unit Code</span>
              <input
                name="unitCode"
                value={formData.unitCode}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Year Of Study</span>
              <input
                name="yearOfStudy"
                type="number"
                min="1"
                value={formData.yearOfStudy}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Question Count</span>
              <input
                name="questionCount"
                type="number"
                min="3"
                max="12"
                value={formData.questionCount}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span>PDF File</span>
              <input
                name="file"
                type="file"
                accept="application/pdf"
                onChange={handleInputChange}
                required
              />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span>Description</span>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
              />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span>Instructions For Students</span>
              <textarea
                name="instructions"
                rows="3"
                value={formData.instructions}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <button className={styles.primaryBtn} type="submit" disabled={uploading}>
            <Upload size={18} />
            {uploading ? "Uploading PDF and generating AI..." : "Upload PDF"}
          </button>
        </form>
      ) : null}

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading {labels.plural}...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          <PageIcon size={80} />
          <h3>No {labels.plural} found</h3>
          <p>{labels.empty}</p>
          <button
            className={styles.primaryBtn}
            onClick={() => setShowCreateForm(true)}
            type="button"
          >
            <Plus size={20} />
            {labels.create}
          </button>
        </div>
      ) : (
        <div className={styles.simulationsGrid}>
          {filteredItems.map((item) => (
            <div key={item.id} className={styles.simulationCard}>
              <div className={styles.cardHeader}>
                <span className={`${styles.simType} ${styles.technical}`}>
                  {item.courseTitle}
                </span>
                <span
                  className={`${styles.simStatus} ${styles[(item.status || "active").toLowerCase()]}`}
                >
                  {item.status}
                </span>
              </div>

              <h3>{item.title}</h3>
              <p className={styles.cardMeta}>
                {item.unitCode} • {item.assignedProgramme} • Year {item.yearOfStudy}
              </p>

              <div className={styles.simStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Participants</span>
                  <span className={styles.statValue}>{item.participants}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Avg. Score</span>
                  <span className={styles.statValue}>{item.averageScore || 0}%</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Questions</span>
                  <span className={styles.statValue}>{item.questionCount}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Points</span>
                  <span className={styles.statValue}>{item.totalPoints}</span>
                </div>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: item.completion || "0%" }}
                ></div>
              </div>

              <div className={styles.participantsSection}>
                <div className={styles.participantsHeader}>
                  <span>Completed Students</span>
                  <span>{item.completedStudents?.length || 0}</span>
                </div>

                {item.completedStudents?.length ? (
                  <div className={styles.participantsList}>
                    {item.completedStudents.map((student) => (
                      <div
                        key={`${item.id}-${student.studentUserNumber}`}
                        className={styles.participantItem}
                      >
                        <div>
                          <strong>{student.studentName}</strong>
                          <p>{student.studentUserNumber}</p>
                        </div>
                        <div className={styles.participantScore}>
                          <strong>
                            {student.score}/{student.totalPoints}
                          </strong>
                          <span>{student.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noParticipants}>
                    No student has completed this {labels.singular} yet.
                  </p>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.lastUpdated}>
                  Updated {formatDate(item.updatedAt)}
                </span>
                <div className={styles.cardActions}>
                  <a
                    className={styles.iconBtn}
                    title="Preview PDF"
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Eye size={16} />
                  </a>
                  <button
                    className={styles.iconBtn}
                    type="button"
                    title={
                      item.status?.toLowerCase() === "active"
                        ? `Deactivate ${labels.singular}`
                        : `Activate ${labels.singular}`
                    }
                    onClick={() => handleToggleStatus(item)}
                    disabled={statusUpdatingId === item.id}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    type="button"
                    title={`Delete ${labels.singular}`}
                    onClick={() => handleDeleteItem(item)}
                    disabled={deletingId === item.id}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimulationManagement;
