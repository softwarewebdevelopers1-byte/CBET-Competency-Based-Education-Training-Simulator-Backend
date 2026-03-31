import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Upload,
  Eye,
  Filter,
  Gamepad2,
  RefreshCw,
  Power,
} from "lucide-react";
import styles from "../styles/simulationManagement.module.css";

const initialForm = {
  courseTitle: "",
  unitName: "",
  unitCode: "",
  assignedProgramme: "",
  assignedDepartment: "",
  yearOfStudy: 1,
  questionCount: 8,
  description: "",
  instructions: "",
  file: null,
};

const formatDate = (value) => {
  if (!value) return "Just now";
  return new Date(value).toLocaleString();
};

const SimulationManagement = () => {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState(initialForm);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");

  const loadSimulations = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await fetch(
        "http://localhost:8000/api/resources/upload/users/data/pdf/admin",
        {
          method: "GET",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load simulations");
      }

      setSimulations(data.simulations || []);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load simulations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSimulations();
  }, []);

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handleCreateSimulation = async (event) => {
    event.preventDefault();
    setUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          payload.append(key, value);
        }
      });

      const response = await fetch(
        "http://localhost:8000/api/resources/upload/users/data/pdf",
        {
          method: "POST",
          credentials: "include",
          body: payload,
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create simulation");
      }

      setSuccessMessage(data.message || "Simulation generated successfully");
      setFormData(initialForm);
      setShowCreateForm(false);
      await loadSimulations();
    } catch (error) {
      setErrorMessage(error.message || "Unable to create simulation");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleSimulationStatus = async (simulation) => {
    const nextStatus =
      simulation.status?.toLowerCase() === "active" ? "inactive" : "active";

    try {
      setStatusUpdatingId(simulation.id);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `http://localhost:8000/api/resources/upload/users/data/pdf/admin/${simulation.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update simulation status");
      }

      setSimulations((current) =>
        current.map((item) =>
          item.id === simulation.id
            ? {
                ...item,
                status: nextStatus,
                updatedAt: data.simulation?.updatedAt || item.updatedAt,
              }
            : item,
        ),
      );
      setSuccessMessage(
        data.message ||
          `Simulation ${nextStatus === "active" ? "activated" : "deactivated"} successfully`,
      );
    } catch (error) {
      setErrorMessage(error.message || "Unable to update simulation status");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const filteredSimulations = useMemo(() => {
    if (filterType === "all") {
      return simulations;
    }

    return simulations.filter(
      (simulation) =>
        simulation.status?.toLowerCase() === filterType ||
        simulation.courseTitle?.toLowerCase().includes(filterType),
    );
  }, [filterType, simulations]);

  return (
    <div className={styles.simulationManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Simulation Management</h1>
          <p className={styles.pageDescription}>
            Upload unit PDFs, generate AI questions, and assign them to students.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryBtn}
            onClick={() =>
              setFilterType((current) => (current === "all" ? "active" : "all"))
            }
          >
            <Filter size={20} />
            {filterType === "all" ? "Show Active" : "Show All"}
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={loadSimulations}
            type="button"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => setShowCreateForm((current) => !current)}
            type="button"
          >
            <Plus size={20} />
            {showCreateForm ? "Close Form" : "Create Simulation"}
          </button>
        </div>
      </div>

      {errorMessage ? <div className={styles.alertError}>{errorMessage}</div> : null}
      {successMessage ? (
        <div className={styles.alertSuccess}>{successMessage}</div>
      ) : null}

      {showCreateForm ? (
        <form className={styles.uploadPanel} onSubmit={handleCreateSimulation}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Programme</span>
              <input
                name="assignedProgramme"
                value={formData.assignedProgramme}
                onChange={handleInputChange}
                required
              />
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
              <span>Unit Name</span>
              <input
                name="unitName"
                value={formData.unitName}
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
          <p>Loading simulations...</p>
        </div>
      ) : filteredSimulations.length === 0 ? (
        <div className={styles.emptyState}>
          <Gamepad2 size={80} />
          <h3>No simulations found</h3>
          <p>Upload a PDF to generate the first AI simulation for students.</p>
          <button
            className={styles.primaryBtn}
            onClick={() => setShowCreateForm(true)}
            type="button"
          >
            <Plus size={20} />
            Create Simulation
          </button>
        </div>
      ) : (
        <div className={styles.simulationsGrid}>
          {filteredSimulations.map((simulation) => (
            <div key={simulation.id} className={styles.simulationCard}>
              <div className={styles.cardHeader}>
                <span className={`${styles.simType} ${styles.technical}`}>
                  {simulation.courseTitle}
                </span>
                <span
                  className={`${styles.simStatus} ${styles[(simulation.status || "active").toLowerCase()]}`}
                >
                  {simulation.status}
                </span>
              </div>

              <h3>{simulation.title}</h3>
              <p className={styles.cardMeta}>
                {simulation.unitCode} • {simulation.assignedProgramme} • Year{" "}
                {simulation.yearOfStudy}
              </p>

              <div className={styles.simStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Participants</span>
                  <span className={styles.statValue}>{simulation.participants}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Avg. Score</span>
                  <span className={styles.statValue}>
                    {simulation.averageScore || 0}%
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Questions</span>
                  <span className={styles.statValue}>
                    {simulation.questionCount}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Points</span>
                  <span className={styles.statValue}>{simulation.totalPoints}</span>
                </div>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: simulation.completion || "0%" }}
                ></div>
              </div>

              <div className={styles.participantsSection}>
                <div className={styles.participantsHeader}>
                  <span>Completed Students</span>
                  <span>{simulation.completedStudents?.length || 0}</span>
                </div>

                {simulation.completedStudents?.length ? (
                  <div className={styles.participantsList}>
                    {simulation.completedStudents.map((student) => (
                      <div
                        key={`${simulation.id}-${student.studentUserNumber}`}
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
                    No student has completed this simulation yet.
                  </p>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.lastUpdated}>
                  Updated {formatDate(simulation.updatedAt)}
                </span>
                <div className={styles.cardActions}>
                  <a
                    className={styles.iconBtn}
                    title="Preview PDF"
                    href={simulation.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Eye size={16} />
                  </a>
                  <button
                    className={styles.iconBtn}
                    type="button"
                    title={
                      simulation.status?.toLowerCase() === "active"
                        ? "Deactivate simulation"
                        : "Activate simulation"
                    }
                    onClick={() => handleToggleSimulationStatus(simulation)}
                    disabled={statusUpdatingId === simulation.id}
                  >
                    <Power size={16} />
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
