import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Link2,
  Pencil,
  PlusSquare,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
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

const INITIAL_PROGRAMME = {
  title: "",
  status: "active",
};

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
  assignmentType: "trainer",
  assigneeUserNumber: "",
};

const UnitManagement = ({ defaultTab = "assignments" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [programmes, setProgrammes] = useState([]);
  const [units, setUnits] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [programmeForm, setProgrammeForm] = useState(INITIAL_PROGRAMME);
  const [editingProgrammeId, setEditingProgrammeId] = useState("");
  const [singleUnitForm, setSingleUnitForm] = useState(INITIAL_SINGLE_UNIT);
  const [editingUnitId, setEditingUnitId] = useState("");
  const [bulkProgramme, setBulkProgramme] = useState("");
  const [bulkUnitsText, setBulkUnitsText] = useState("");
  const [assignmentForm, setAssignmentForm] = useState(INITIAL_ASSIGNMENT);
  const [assignmentMode, setAssignmentMode] = useState("create");
  const [programmeSearchTerm, setProgrammeSearchTerm] = useState("");
  const [unitSearchTerm, setUnitSearchTerm] = useState("");

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
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const programmeOptions = useMemo(
    () => programmes.map((programme) => programme.title),
    [programmes],
  );

  const trainerAssignments = useMemo(
    () => assignments.filter((item) => item.assignmentType === "trainer"),
    [assignments],
  );

  const selectedAssigneeOptions = trainers;

  const handleProgrammeChange = (event) => {
    const { name, value } = event.target;
    setProgrammeForm((current) => ({ ...current, [name]: value }));
  };

  const handleSingleUnitChange = (event) => {
    const { name, value } = event.target;
    setSingleUnitForm((current) => ({ ...current, [name]: value }));
  };

  const handleAssignmentChange = (event) => {
    const { name, value } = event.target;
    setAssignmentForm((current) => {
      const nextState = { ...current, [name]: value };
      if (name === "assignmentType") {
        nextState.assignmentType = "trainer";
      }

      return nextState;
    });
  };

  const resetProgrammeForm = () => {
    setProgrammeForm(INITIAL_PROGRAMME);
    setEditingProgrammeId("");
  };

  const resetUnitForm = () => {
    setSingleUnitForm(INITIAL_SINGLE_UNIT);
    setEditingUnitId("");
  };

  const resetAssignmentForm = () => {
    setAssignmentForm(INITIAL_ASSIGNMENT);
    setAssignmentMode("create");
  };

  const getAssignmentForUnit = (unitId, assignmentType) =>
    assignments.find(
      (assignment) =>
        assignment.assignmentType === assignmentType &&
        String(assignment.unitId) === String(unitId),
    );

  const programmeLookup = useMemo(
    () =>
      new Map(programmes.map((programme) => [programme.title.toLowerCase(), programme])),
    [programmes],
  );

  const filteredProgrammes = useMemo(() => {
    const normalizedSearch = programmeSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return programmes;
    }

    return programmes.filter((programme) => {
      const title = String(programme.title ?? "").toLowerCase();
      const status = String(programme.status ?? "").toLowerCase();
      return title.includes(normalizedSearch) || status.includes(normalizedSearch);
    });
  }, [programmeSearchTerm, programmes]);

  const filteredUnits = useMemo(() => {
    const normalizedSearch = unitSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return units;
    }

    return units.filter((unit) => {
      const searchableParts = [
        unit.courseTitle,
        unit.unitCode,
        unit.unitName,
        unit.department,
        unit.trainerName,
        unit.status,
        `year ${unit.yearOfStudy}`,
      ];

      return searchableParts.some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedSearch),
      );
    });
  }, [unitSearchTerm, units]);

  const handleProgrammeSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const isEditing = Boolean(editingProgrammeId);
      const endpoint = isEditing
        ? `${API_BASE_URL}/auth/admin/unit-management/programmes/${encodeURIComponent(editingProgrammeId)}`
        : `${API_BASE_URL}/auth/admin/unit-management/programmes`;
      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(programmeForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save programme");
      }

      setSuccessMessage(data.message || "Programme saved successfully.");
      resetProgrammeForm();
      await fetchOverview();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save programme",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgramme = async (programme) => {
    const confirmed = window.confirm(
      `Delete programme "${programme.title}" and all related units, assignments, documents, and assessments?`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/unit-management/programmes/${encodeURIComponent(programme._id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete programme");
      }

      if (editingProgrammeId === programme._id) {
        resetProgrammeForm();
      }

      setSuccessMessage(data.message || "Programme deleted successfully.");
      await fetchOverview();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete programme",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrUpdateUnit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const isEditing = Boolean(editingUnitId);
      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/auth/admin/unit-management/units/${encodeURIComponent(editingUnitId)}`
          : `${API_BASE_URL}/auth/admin/unit-management/programmes/${encodeURIComponent(singleUnitForm.programme)}/units`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            courseTitle: singleUnitForm.programme,
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
        throw new Error(data.error || "Unable to save unit");
      }

      setSuccessMessage(
        data.message ||
          (isEditing ? "Unit updated successfully." : "Unit added successfully."),
      );
      resetUnitForm();
      await fetchOverview();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to save unit",
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

  const handleDeleteUnit = async (unit) => {
    const confirmed = window.confirm(
      `Delete unit "${unit.unitCode} - ${unit.unitName}" and all its registrations, assignments, documents, and assessments?`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/unit-management/units/${encodeURIComponent(unit._id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete unit");
      }

      if (editingUnitId === unit._id) {
        resetUnitForm();
      }

      setSuccessMessage(data.message || "Unit deleted successfully.");
      await fetchOverview();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete unit",
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
        assignmentMode === "update"
          ? `${API_BASE_URL}/auth/admin/unit-management/units/${encodeURIComponent(assignmentForm.unitId)}/assignments/${encodeURIComponent(assignmentForm.assignmentType)}`
          : `${API_BASE_URL}/auth/admin/unit-management/units/${encodeURIComponent(assignmentForm.unitId)}/assignments`,
        {
          method: assignmentMode === "update" ? "PATCH" : "POST",
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

      setSuccessMessage(
        data.message ||
          (assignmentMode === "update"
            ? "Unit assignment updated successfully."
            : "Unit assignment saved successfully."),
      );
      resetAssignmentForm();
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

  const startProgrammeEdit = (programme) => {
    setProgrammeForm({
      title: programme.title,
      status: programme.status || "active",
    });
    setEditingProgrammeId(programme._id);
    setActiveTab("courses");
  };

  const startUnitEdit = (unit) => {
    setSingleUnitForm({
      programme: unit.courseTitle,
      unitCode: unit.unitCode,
      unitName: unit.unitName,
      department: unit.department,
      yearOfStudy: String(unit.yearOfStudy || 1),
      status: unit.status || "active",
    });
    setEditingUnitId(unit._id);
    setActiveTab("single-add");
  };

  const startAssignmentUpdate = (unitId, assignmentType, assigneeUserNumber) => {
    setAssignmentForm({
      unitId: String(unitId),
      assignmentType: "trainer",
      assigneeUserNumber,
    });
    setAssignmentMode("update");
    setActiveTab("assignments");
  };

  const handleDeleteAssignment = async (assignment) => {
    const confirmed = window.confirm(
      `Remove trainer "${assignment.assigneeName}" from ${assignment.unitCode} - ${assignment.unitName}?`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/unit-management/units/${encodeURIComponent(assignment.unitId)}/assignments/${encodeURIComponent(assignment._id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete assignment");
      }

      if (
        assignmentMode === "update" &&
        String(assignmentForm.unitId) === String(assignment.unitId)
      ) {
        resetAssignmentForm();
      }

      setSuccessMessage(data.message || "Trainer assignment deleted successfully.");
      await fetchOverview();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete assignment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Course and Unit Management</h1>
          <p className={styles.pageSubtitle}>
            Create programmes, manage units, replace assigned trainers,
            and remove units when they are no longer needed.
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
          className={`${styles.tabButton} ${activeTab === "courses" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("courses")}
          type="button"
        >
          <BookOpen size={16} /> Courses
        </button>
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
          <Upload size={16} /> Add Units in Bulk
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "single-add" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("single-add")}
          type="button"
        >
          <PlusSquare size={16} /> Add or Edit Unit
        </button>
      </div>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      {successMessage ? (
        <div className={styles.successBanner}>{successMessage}</div>
      ) : null}

      {loading ? (
        <div className={styles.loadingState}>Loading unit management data...</div>
      ) : null}

      {!loading && activeTab === "courses" ? (
        <div className={styles.grid}>
          <form className={styles.panel} onSubmit={handleProgrammeSubmit}>
            <div className={styles.panelHeader}>
              <h2>{editingProgrammeId ? "Edit Programme" : "Create Programme"}</h2>
              <p>Add a new programme or rename/deactivate an existing one.</p>
            </div>

            <label className={styles.field}>
              <span>Programme Title</span>
              <input
                type="text"
                name="title"
                value={programmeForm.title}
                onChange={handleProgrammeChange}
                placeholder="Diploma in Computer Science"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Status</span>
              <select
                name="status"
                value={programmeForm.status}
                onChange={handleProgrammeChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <div className={styles.actionRow}>
              <button className={styles.primaryButton} type="submit" disabled={submitting}>
                <Save size={16} /> {submitting ? "Saving..." : editingProgrammeId ? "Update Programme" : "Create Programme"}
              </button>
              {editingProgrammeId ? (
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={resetProgrammeForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Programme List</h2>
              <p>Rename or delete any programme from here.</p>
            </div>

            <label className={styles.searchField}>
              <span>Search Programmes</span>
              <input
                type="search"
                value={programmeSearchTerm}
                onChange={(event) => setProgrammeSearchTerm(event.target.value)}
                placeholder="Search by programme title or status"
              />
            </label>

            <div className={`${styles.entityList} ${styles.scrollableList}`}>
              {filteredProgrammes.length > 0 ? (
                filteredProgrammes.map((programme) => (
                  <div key={programme._id} className={styles.entityItem}>
                    <div>
                      <strong>{programme.title}</strong>
                      <span>{programme.unitCount || 0} units • {programme.status}</span>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => startProgrammeEdit(programme)}
                        title="Edit programme"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.deleteButton}`}
                        onClick={() => handleDeleteProgramme(programme)}
                        title="Delete programme"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : programmes.length > 0 ? (
                <p className={styles.emptyCopy}>No programmes match your search.</p>
              ) : (
                <p className={styles.emptyCopy}>No programmes available yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "assignments" ? (
        <div className={styles.grid}>
          <form className={styles.panel} onSubmit={handleAssignmentSubmit}>
            <div className={styles.panelHeader}>
              <h2>{assignmentMode === "update" ? "Update Assignment" : "Assign Unit"}</h2>
              <p>
                Create a trainer assignment, replace the current trainer, or
                remove the assignment when needed.
              </p>
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
              <span>Trainer</span>
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

            <div className={styles.actionRow}>
              <button className={styles.primaryButton} type="submit" disabled={submitting}>
                <Save size={16} /> {submitting ? "Saving..." : assignmentMode === "update" ? "Update Assignment" : "Save Assignment"}
              </button>
              {assignmentMode === "update" ? (
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={resetAssignmentForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Assignment Summary</h2>
              <p>Replace or remove current trainers from these assignments.</p>
            </div>

            <div className={styles.assignmentSection}>
              <h3>Trainer Assignments</h3>
              <div className={styles.assignmentList}>
                {trainerAssignments.length > 0 ? (
                  trainerAssignments.map((assignment) => (
                    <div key={assignment._id} className={styles.assignmentItem}>
                      <strong>{assignment.unitCode}</strong>
                      <span>{assignment.unitName}</span>
                      <span>
                        {assignment.assigneeName} ({assignment.assigneeUserNumber})
                      </span>
                      <div className={styles.assignmentActions}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() =>
                            startAssignmentUpdate(
                              assignment.unitId,
                              "trainer",
                              assignment.assigneeUserNumber,
                            )
                          }
                        >
                          Replace Trainer
                        </button>
                        <button
                          type="button"
                          className={`${styles.secondaryButton} ${styles.deleteActionButton}`}
                          onClick={() => handleDeleteAssignment(assignment)}
                        >
                          Delete Assignment
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyCopy}>No trainers assigned yet.</p>
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
        <div className={styles.grid}>
          <form className={styles.panel} onSubmit={handleCreateOrUpdateUnit}>
            <div className={styles.panelHeader}>
              <h2>{editingUnitId ? "Edit Unit" : "Add One Unit to a Programme"}</h2>
              <p>Create a unit, update its details, or prepare it for reassignment.</p>
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

            <div className={styles.actionRow}>
              <button className={styles.primaryButton} type="submit" disabled={submitting}>
                <Save size={16} /> {submitting ? "Saving..." : editingUnitId ? "Update Unit" : "Add Unit"}
              </button>
              {editingUnitId ? (
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={resetUnitForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Unit List</h2>
              <p>Edit a unit, delete it, or jump into assignment replacement.</p>
            </div>

            <label className={styles.searchField}>
              <span>Search Units</span>
              <input
                type="search"
                value={unitSearchTerm}
                onChange={(event) => setUnitSearchTerm(event.target.value)}
                placeholder="Search by programme, unit code, unit name, trainer, or department"
              />
            </label>

            <div className={`${styles.entityList} ${styles.scrollableList}`}>
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => {
                  const trainerAssignment = getAssignmentForUnit(unit._id, "trainer");
                  const programmeStatus =
                    programmeLookup.get(String(unit.courseTitle).toLowerCase())?.status ||
                    "active";

                  return (
                    <div key={unit._id} className={styles.entityItem}>
                      <div>
                        <strong>
                          {unit.unitCode} - {unit.unitName}
                        </strong>
                        <span>
                          {unit.courseTitle} • {unit.department} • Year {unit.yearOfStudy} • {unit.status} • Programme {programmeStatus}
                        </span>
                        <span>
                          Trainer: {unit.trainerName || trainerAssignment?.assigneeName || "Not assigned"}
                        </span>
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => startUnitEdit(unit)}
                          title="Edit unit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          onClick={() => handleDeleteUnit(unit)}
                          title="Delete unit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : units.length > 0 ? (
                <p className={styles.emptyCopy}>No units match your search.</p>
              ) : (
                <p className={styles.emptyCopy}>No units available yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <datalist id="programme-options">
        {programmeOptions.map((programme) => (
          <option key={programme} value={programme} />
        ))}
      </datalist>
    </div>
  );
};

export default UnitManagement;
