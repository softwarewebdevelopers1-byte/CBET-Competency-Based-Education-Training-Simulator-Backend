import React, { useEffect, useMemo, useState } from "react";
import { Link2, PlusSquare, Upload } from "lucide-react";
import styles from "../styles/unitManagement.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://cbet-competency-based-education-training.onrender.com";

const buildBulkTextFromUnits = (units) =>
  units
    .map(
      (unit) =>
        `${unit.unitCode}, ${unit.unitName}, ${unit.department}, ${unit.yearOfStudy || 1}`,
    )
    .join("\n");

const INITIAL_SINGLE_UNIT = {
  programme: "",
  unitCode: "",
  unitName: "",
  department: "",
  yearOfStudy: "1",
  status: "active",
};

const INITIAL_ASSIGNMENT = {
  unitId: "",
  assignmentType: "lecturer",
  assigneeUserNumber: "",
};

const UnitManagement = ({ defaultTab = "assignments" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [programmes, setProgrammes] = useState([]);
  const [units, setUnits] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [singleUnitForm, setSingleUnitForm] = useState(INITIAL_SINGLE_UNIT);
  const [bulkProgramme, setBulkProgramme] = useState("");
  const [bulkUnitsText, setBulkUnitsText] = useState("");
  const [assignmentForm, setAssignmentForm] = useState(INITIAL_ASSIGNMENT);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/auth/admin/unit-management/overview`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load unit management data");
      }

      setProgrammes(Array.isArray(data.programmes) ? data.programmes : []);
      setUnits(Array.isArray(data.units) ? data.units : []);
      setTrainers(Array.isArray(data.trainers) ? data.trainers : []);
      setTrainees(Array.isArray(data.trainees) ? data.trainees : []);
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load unit management data",
      );
      setProgrammes([]);
      setUnits([]);
      setTrainers([]);
      setTrainees([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const traineeAssignments = useMemo(
    () => assignments.filter((item) => item.assignmentType === "trainee"),
    [assignments],
  );

  const lecturerAssignments = useMemo(
    () => assignments.filter((item) => item.assignmentType === "lecturer"),
    [assignments],
  );

  const selectedAssigneeOptions =
    assignmentForm.assignmentType === "lecturer" ? trainers : trainees;

  const handleSingleUnitChange = (event) => {
    const { name, value } = event.target;
    setSingleUnitForm((current) => ({ ...current, [name]: value }));
  };

  const handleAssignmentChange = (event) => {
    const { name, value } = event.target;
    setAssignmentForm((current) => {
      const nextState = { ...current, [name]: value };

      if (name === "assignmentType") {
        nextState.assigneeUserNumber = "";
      }

      return nextState;
    });
  };

  const handleCreateSingleUnit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/unit-management/programmes/${encodeURIComponent(singleUnitForm.programme)}/units`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            unitCode: singleUnitForm.unitCode,
            unitName: singleUnitForm.unitName,
            department: singleUnitForm.department,
            yearOfStudy: Number(singleUnitForm.yearOfStudy),
            status: singleUnitForm.status,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to add unit");
      }

      setSuccessMessage("Unit added to programme successfully.");
      setSingleUnitForm(INITIAL_SINGLE_UNIT);
      await fetchOverview();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to add unit",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const unitsPayload = bulkUnitsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [unitCode = "", unitName = "", department = "", yearOfStudy = "1"] =
            line.split(",").map((part) => part.trim());

          return {
            unitCode,
            unitName,
            department,
            yearOfStudy: Number(yearOfStudy) || 1,
            status: "active",
          };
        });

      const response = await fetch(
        `${API_BASE_URL}/auth/admin/unit-management/programmes/${encodeURIComponent(bulkProgramme)}/units/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ units: unitsPayload }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to bulk add units");
      }

      setSuccessMessage(
        `Bulk upload complete. Created ${data.createdCount || 0} units and skipped ${data.skippedCount || 0}.`,
      );
      setBulkProgramme("");
      setBulkUnitsText("");
      await fetchOverview();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to bulk add units",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignmentSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/unit-management/units/${encodeURIComponent(assignmentForm.unitId)}/assignments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            assignmentType: assignmentForm.assignmentType,
            assigneeUserNumber: assignmentForm.assigneeUserNumber,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save assignment");
      }

      setSuccessMessage("Unit assignment saved successfully.");
      setAssignmentForm(INITIAL_ASSIGNMENT);
      await fetchOverview();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save assignment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Unit Management</h1>
          <p className={styles.pageSubtitle}>
            Add units to programmes and assign lecturers or trainees to specific units.
          </p>
        </div>
        <div className={styles.metrics}>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{programmes.length}</span>
            <span className={styles.metricLabel}>Programmes</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{units.length}</span>
            <span className={styles.metricLabel}>Units</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{assignments.length}</span>
            <span className={styles.metricLabel}>Assignments</span>
          </div>
        </div>
      </div>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${activeTab === "assignments" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("assignments")}
          type="button"
        >
          <Link2 size={16} /> Assign Units
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "bulk-add" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("bulk-add")}
          type="button"
        >
          <Upload size={16} /> Add Units to Programme
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "single-add" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("single-add")}
          type="button"
        >
          <PlusSquare size={16} /> Add One Unit
        </button>
      </div>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      {successMessage ? (
        <div className={styles.successBanner}>{successMessage}</div>
      ) : null}

      {loading ? (
        <div className={styles.loadingState}>Loading unit management data...</div>
      ) : null}

      {!loading && activeTab === "assignments" ? (
        <div className={styles.grid}>
          <form className={styles.panel} onSubmit={handleAssignmentSubmit}>
            <div className={styles.panelHeader}>
              <h2>Assign Lecturer or Trainee</h2>
              <p>Choose a unit and link it to a trainer or a student.</p>
            </div>

            <label className={styles.field}>
              <span>Unit</span>
              <select
                name="unitId"
                value={assignmentForm.unitId}
                onChange={handleAssignmentChange}
                required
              >
                <option value="">Select unit</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.courseTitle} - Y{unit.yearOfStudy} - {unit.unitCode} - {unit.unitName}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Assignment Type</span>
              <select
                name="assignmentType"
                value={assignmentForm.assignmentType}
                onChange={handleAssignmentChange}
              >
                <option value="lecturer">Lecturer</option>
                <option value="trainee">Trainee</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>{assignmentForm.assignmentType === "lecturer" ? "Lecturer" : "Trainee"}</span>
              <select
                name="assigneeUserNumber"
                value={assignmentForm.assigneeUserNumber}
                onChange={handleAssignmentChange}
                required
              >
                <option value="">Select person</option>
                {selectedAssigneeOptions.map((user) => (
                  <option key={user.UserNumber} value={user.UserNumber}>
                    {user.fullName} ({user.UserNumber}) {user.programme ? `- ${user.programme}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Assignment"}
            </button>
          </form>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Assignment Summary</h2>
              <p>Current lecturer and trainee links per unit.</p>
            </div>

            <div className={styles.assignmentSection}>
              <h3>Lecturer Assignments</h3>
              <div className={styles.assignmentList}>
                {lecturerAssignments.length > 0 ? (
                  lecturerAssignments.map((assignment) => (
                    <div key={assignment._id} className={styles.assignmentItem}>
                      <strong>{assignment.unitCode}</strong>
                      <span>{assignment.unitName}</span>
                      <span>
                        {assignment.assigneeName} ({assignment.assigneeUserNumber})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyCopy}>No lecturers assigned yet.</p>
                )}
              </div>
            </div>

            <div className={styles.assignmentSection}>
              <h3>Trainee Assignments</h3>
              <div className={styles.assignmentList}>
                {traineeAssignments.length > 0 ? (
                  traineeAssignments.map((assignment) => (
                    <div key={assignment._id} className={styles.assignmentItem}>
                      <strong>{assignment.unitCode}</strong>
                      <span>{assignment.unitName}</span>
                      <span>
                        {assignment.assigneeName} ({assignment.assigneeUserNumber})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyCopy}>No trainees assigned yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "bulk-add" ? (
        <div className={styles.grid}>
          <form className={styles.panel} onSubmit={handleBulkCreate}>
            <div className={styles.panelHeader}>
              <h2>Add Multiple Units to a Programme</h2>
              <p>Use one line per unit: `UNIT101, Unit Name, Department, 1`</p>
            </div>

            <label className={styles.field}>
              <span>Programme</span>
              <input
                type="text"
                value={bulkProgramme}
                onChange={(event) => setBulkProgramme(event.target.value)}
                list="programme-options"
                placeholder="Enter or select a programme"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Units</span>
              <textarea
                rows="10"
                value={bulkUnitsText}
                onChange={(event) => setBulkUnitsText(event.target.value)}
                placeholder="TXT101, Textile Fundamentals, Fashion Department, 1"
                required
              />
            </label>

            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Upload Units"}
            </button>
          </form>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Existing Units Preview</h2>
              <p>Copy current units and paste back after editing if needed.</p>
            </div>
            <textarea
              className={styles.previewBox}
              readOnly
              value={buildBulkTextFromUnits(units)}
            />
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "single-add" ? (
        <div className={styles.gridSingle}>
          <form className={styles.panel} onSubmit={handleCreateSingleUnit}>
            <div className={styles.panelHeader}>
              <h2>Add One Unit to a Programme</h2>
              <p>Create a single programme unit with its year and department.</p>
            </div>

            <label className={styles.field}>
              <span>Programme</span>
              <input
                type="text"
                name="programme"
                value={singleUnitForm.programme}
                onChange={handleSingleUnitChange}
                list="programme-options"
                placeholder="Enter or select a programme"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Unit Code</span>
              <input
                type="text"
                name="unitCode"
                value={singleUnitForm.unitCode}
                onChange={handleSingleUnitChange}
                placeholder="TXT101"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Unit Name</span>
              <input
                type="text"
                name="unitName"
                value={singleUnitForm.unitName}
                onChange={handleSingleUnitChange}
                placeholder="Textile Fundamentals"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Department</span>
              <input
                type="text"
                name="department"
                value={singleUnitForm.department}
                onChange={handleSingleUnitChange}
                placeholder="Fashion Department"
                required
              />
            </label>

            <div className={styles.inlineFields}>
              <label className={styles.field}>
                <span>Year of Study</span>
                <input
                  type="number"
                  min="1"
                  name="yearOfStudy"
                  value={singleUnitForm.yearOfStudy}
                  onChange={handleSingleUnitChange}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Status</span>
                <select
                  name="status"
                  value={singleUnitForm.status}
                  onChange={handleSingleUnitChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add Unit"}
            </button>
          </form>
        </div>
      ) : null}

      <datalist id="programme-options">
        {programmes.map((programme) => (
          <option key={programme} value={programme} />
        ))}
      </datalist>
    </div>
  );
};

export default UnitManagement;
