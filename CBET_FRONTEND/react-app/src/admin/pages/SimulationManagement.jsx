import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Upload,
  Eye,
  Filter,
  Gamepad2,
  ClipboardCheck,
  RefreshCw,
  Power,
  Trash2,
} from "lucide-react";
import styles from "../styles/simulationManagement.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://cbet-competency-based-education-training.onrender.com";

const CACHE_TTL_MS = 5 * 60 * 1000;

const createEmptyQuestion = (index = 0) => ({
  prompt: "",
  explanation: "",
  points: 10,
  correctOptionId: "a",
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
  localId: `question-${Date.now()}-${index}`,
});

const getCacheKey = (...parts) => `cbet-cache::${parts.join("::")}`;

const readCache = (key) => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    if (!parsed?.expiresAt || Date.now() > Number(parsed.expiresAt)) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data ?? null;
  } catch {
    return null;
  }
};

const writeCache = (key, data, ttlMs = CACHE_TTL_MS) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        expiresAt: Date.now() + ttlMs,
      }),
    );
  } catch {
    // Ignore browser storage quota errors and fall back to network fetches.
  }
};

const clearAssessmentCaches = (ownership, activityType, itemId = "") => {
  [
    getCacheKey("simulation-items", ownership, activityType),
    getCacheKey("simulation-form-options", ownership),
    itemId ? getCacheKey("simulation-detail", itemId) : "",
  ]
    .filter(Boolean)
    .forEach((key) => localStorage.removeItem(key));
};

const initialForm = {
  creationMode: "ai",
  unitId: "",
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
  questions: [createEmptyQuestion(0)],
};

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
      empty:
        "Upload a PDF to generate the first interactive scenario for students.",
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
    icon: ClipboardCheck,
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
  const [programmeOptions, setProgrammeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [reviewItem, setReviewItem] = useState(null);

  const itemsCacheKey = getCacheKey(
    "simulation-items",
    ownership,
    activityType,
  );
  const formOptionsCacheKey = getCacheKey("simulation-form-options", ownership);

  const loadItems = async () => {
    try {
      const cachedItems = readCache(itemsCacheKey);
      if (cachedItems) {
        setItems(cachedItems);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");
      const query = new URLSearchParams({
        activityType,
        ownership,
      });
      const response = await fetch(
        `${API_BASE_URL}/api/resources/assessments/admin?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to load ${labels.plural}`);
      }

      const nextItems = data.assessments || data.simulations || [];
      setItems(nextItems);
      writeCache(itemsCacheKey, nextItems);
    } catch (error) {
      setErrorMessage(error.message || `Unable to load ${labels.plural}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [activityType, ownership]);

  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const cachedOptions = readCache(formOptionsCacheKey);
        if (cachedOptions) {
          setUnitOptions(cachedOptions.units || []);
          setProgrammeOptions(cachedOptions.programmes || []);
          return;
        }

        const response =
          ownership === "self"
            ? await fetch(
                `${API_BASE_URL}/auth/admin/upload/courses/trainer/assigned-units`,
                {
                  method: "GET",
                  credentials: "include",
                },
              )
            : await fetch(
                `${API_BASE_URL}/auth/admin/unit-management/overview`,
                {
                  method: "GET",
                  credentials: "include",
                },
              );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || data.message || "Unable to load form options",
          );
        }

        const units = Array.isArray(data.units) ? data.units : [];
        const programmes =
          ownership === "self"
            ? Array.from(
                new Set(
                  units
                    .map((unit) => String(unit.courseTitle ?? "").trim())
                    .filter(Boolean),
                ),
              ).sort((a, b) => a.localeCompare(b))
            : (Array.isArray(data.programmes) ? data.programmes : [])
                .filter(
                  (programme) =>
                    String(programme.status ?? "active").toLowerCase() ===
                    "active",
                )
                .map((programme) => programme.title);

        setUnitOptions(units);
        setProgrammeOptions(programmes);
        writeCache(formOptionsCacheKey, { units, programmes });
      } catch (error) {
        setUnitOptions([]);
        setProgrammeOptions([]);
        setErrorMessage(
          (current) =>
            current || error.message || "Unable to load form options",
        );
      }
    };

    loadFormOptions();
  }, [ownership]);

  const filteredUnitOptions = useMemo(
    () =>
      unitOptions.filter((unit) =>
        formData.assignedProgramme
          ? String(unit.courseTitle ?? "").trim() === formData.assignedProgramme
          : true,
      ),
    [formData.assignedProgramme, unitOptions],
  );

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;

    if (files) {
      setFormData((current) => ({
        ...current,
        [name]: files[0],
      }));
      return;
    }

    if (name === "assignedProgramme") {
      setFormData((current) => ({
        ...current,
        assignedProgramme: value,
        unitId: "",
        courseTitle: value,
        unitSubtitle: "",
        unitCode: "",
        assignedDepartment: "",
      }));
      return;
    }

    if (name === "unitId") {
      const selectedUnit = unitOptions.find(
        (unit) => String(unit._id) === String(value),
      );

      setFormData((current) => ({
        ...current,
        unitId: value,
        courseTitle: selectedUnit?.courseTitle || current.assignedProgramme,
        assignedProgramme:
          selectedUnit?.courseTitle || current.assignedProgramme,
        unitSubtitle: selectedUnit?.unitName || "",
        unitCode: selectedUnit?.unitCode || "",
        assignedDepartment: selectedUnit?.department || "",
        yearOfStudy: selectedUnit?.yearOfStudy || current.yearOfStudy,
      }));
      return;
    }

    if (name === "creationMode") {
      setFormData((current) => ({
        ...current,
        creationMode: value,
        questionCount:
          value === "manual"
            ? current.questions.length || 1
            : current.questionCount,
        questions:
          value === "manual" &&
          (!Array.isArray(current.questions) || current.questions.length === 0)
            ? [createEmptyQuestion(0)]
            : current.questions,
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    setFormData((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex ? { ...question, [field]: value } : question,
      ),
    }));
  };

  const handleOptionChange = (questionIndex, optionId, value) => {
    setFormData((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, text: value } : option,
              ),
            }
          : question,
      ),
    }));
  };

  const addManualQuestion = () => {
    setFormData((current) => ({
      ...current,
      questions: [
        ...current.questions,
        createEmptyQuestion(current.questions.length),
      ],
      questionCount: current.questions.length + 1,
    }));
  };

  const removeManualQuestion = (questionIndex) => {
    setFormData((current) => {
      const nextQuestions = current.questions.filter(
        (_, index) => index !== questionIndex,
      );
      return {
        ...current,
        questions: nextQuestions.length
          ? nextQuestions
          : [createEmptyQuestion(0)],
        questionCount: nextQuestions.length || 1,
      };
    });
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
        if (key === "questions") {
          return;
        }
        if (value !== null && value !== undefined && value !== "") {
          payload.append(key, value);
        }
      });

      if (formData.creationMode === "manual") {
        payload.set("questionCount", String(formData.questions.length));
        payload.append(
          "questions",
          JSON.stringify(
            formData.questions.map((question) => ({
              prompt: question.prompt,
              explanation: question.explanation,
              points: Number(question.points) || 10,
              correctOptionId: question.correctOptionId,
              options: question.options,
            })),
          ),
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/resources/assessments`,
        {
          method: "POST",
          credentials: "include",
          body: payload,
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to create ${labels.singular}`);
      }

      setSuccessMessage(
        data.message || `${labels.create} generated successfully`,
      );
      setFormData(initialForm);
      setShowCreateForm(false);
      clearAssessmentCaches(ownership, activityType);
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
        `${API_BASE_URL}/api/resources/assessments/admin/${item.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Unable to update ${labels.singular} status`,
        );
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
      clearAssessmentCaches(ownership, activityType, item.id);
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
        `${API_BASE_URL}/api/resources/assessments/admin/${item.id}`,
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
      clearAssessmentCaches(ownership, activityType, item.id);
      setSuccessMessage(
        data.message ||
          `${labels.singular} and related records deleted successfully`,
      );
    } catch (error) {
      setErrorMessage(error.message || `Unable to delete ${labels.singular}`);
    } finally {
      setDeletingId("");
    }
  };

  const handleReviewItem = async (itemId) => {
    try {
      setReviewingId(itemId);
      setErrorMessage("");
      const detailCacheKey = getCacheKey("simulation-detail", itemId);
      const cachedDetail = readCache(detailCacheKey);

      if (cachedDetail) {
        setReviewItem(cachedDetail);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/resources/assessments/admin/${itemId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to review ${labels.singular}`);
      }

      const nextReviewItem = data.assessment || data.simulation;
      setReviewItem(nextReviewItem);
      writeCache(detailCacheKey, nextReviewItem);
    } catch (error) {
      setErrorMessage(error.message || `Unable to review ${labels.singular}`);
    } finally {
      setReviewingId("");
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
          <button
            className={styles.secondaryBtn}
            onClick={loadItems}
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
            {showCreateForm ? "Close Form" : labels.create}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className={styles.alertError}>{errorMessage}</div>
      ) : null}
      {successMessage ? (
        <div className={styles.alertSuccess}>{successMessage}</div>
      ) : null}

      {showCreateForm ? (
        <form className={styles.uploadPanel} onSubmit={handleCreateItem}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Creation Mode</span>
              <select
                name="creationMode"
                value={formData.creationMode}
                onChange={handleInputChange}
              >
                <option value="ai">AI Generated</option>
                <option value="manual">Manual Creation</option>
              </select>
            </label>
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
              <span>Unit</span>
              <select
                name="unitId"
                value={formData.unitId}
                onChange={handleInputChange}
                required
                disabled={!formData.assignedProgramme}
              >
                <option value="">Select unit</option>
                {filteredUnitOptions.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.unitCode} - {unit.unitName}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Course Title</span>
              <input
                name="courseTitle"
                value={formData.courseTitle}
                readOnly
                required
              />
            </label>
            <label className={styles.field}>
              <span>Unit Subtitle</span>
              <input
                name="unitSubtitle"
                value={formData.unitSubtitle}
                readOnly
                required
              />
            </label>
            <label className={styles.field}>
              <span>Unit Code</span>
              <input
                name="unitCode"
                value={formData.unitCode}
                readOnly
                required
              />
            </label>
            <label className={styles.field}>
              <span>Department</span>
              <input
                name="assignedDepartment"
                value={formData.assignedDepartment}
                readOnly
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
            {formData.creationMode === "ai" ? (
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
            ) : null}
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
            {formData.creationMode === "manual" ? (
              <div className={`${styles.fieldWide} ${styles.manualBuilder}`}>
                <div className={styles.manualBuilderHeader}>
                  <div>
                    <h3>Manual Questions</h3>
                    <p>
                      Create the questions and answers exactly how students will
                      see them.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={addManualQuestion}
                  >
                    <Plus size={16} />
                    Add Question
                  </button>
                </div>

                <div className={styles.questionsList}>
                  {formData.questions.map((question, questionIndex) => (
                    <div
                      key={question.localId}
                      className={styles.questionEditor}
                    >
                      <div className={styles.questionEditorHeader}>
                        <strong>Question {questionIndex + 1}</strong>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          onClick={() => removeManualQuestion(questionIndex)}
                          disabled={formData.questions.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <label className={styles.field}>
                        <span>Prompt</span>
                        <textarea
                          rows="2"
                          value={question.prompt}
                          onChange={(event) =>
                            handleQuestionChange(
                              questionIndex,
                              "prompt",
                              event.target.value,
                            )
                          }
                          required
                        />
                      </label>

                      <div className={styles.optionsGrid}>
                        {question.options.map((option) => (
                          <label key={option.id} className={styles.field}>
                            <span>Option {option.id.toUpperCase()}</span>
                            <input
                              type="text"
                              value={option.text}
                              onChange={(event) =>
                                handleOptionChange(
                                  questionIndex,
                                  option.id,
                                  event.target.value,
                                )
                              }
                              required
                            />
                          </label>
                        ))}
                      </div>

                      <div className={styles.manualMetaGrid}>
                        <label className={styles.field}>
                          <span>Correct Answer</span>
                          <select
                            value={question.correctOptionId}
                            onChange={(event) =>
                              handleQuestionChange(
                                questionIndex,
                                "correctOptionId",
                                event.target.value,
                              )
                            }
                          >
                            {question.options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.id.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Points</span>
                          <input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(event) =>
                              handleQuestionChange(
                                questionIndex,
                                "points",
                                event.target.value,
                              )
                            }
                            required
                          />
                        </label>
                      </div>

                      <label className={styles.field}>
                        <span>Explanation</span>
                        <textarea
                          rows="2"
                          value={question.explanation}
                          onChange={(event) =>
                            handleQuestionChange(
                              questionIndex,
                              "explanation",
                              event.target.value,
                            )
                          }
                          required
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <button
            className={styles.primaryBtn}
            type="submit"
            disabled={uploading}
          >
            <Upload size={18} />
            {uploading
              ? formData.creationMode === "manual"
                ? "Uploading PDF and saving manual questions..."
                : "Uploading PDF and generating AI..."
              : formData.creationMode === "manual"
                ? "Create Manual Assessment"
                : "Upload PDF"}
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
                <div className={styles.cardBadges}>
                  <span className={`${styles.simType} ${styles.technical}`}>
                    {item.courseTitle}
                  </span>
                  <span
                    className={`${styles.creationBadge} ${styles[item.creationMode || "ai"]}`}
                  >
                    {item.creationMode === "manual" ? "Manual" : "AI"}
                  </span>
                </div>
                <span
                  className={`${styles.simStatus} ${styles[(item.status || "active").toLowerCase()]}`}
                >
                  {item.status}
                </span>
              </div>

              <h3>{item.title}</h3>
              <p className={styles.cardMeta}>
                {item.unitCode} • {item.assignedProgramme} • Year{" "}
                {item.yearOfStudy}
              </p>

              <div className={styles.simStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Participants</span>
                  <span className={styles.statValue}>{item.participants}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Avg. Score</span>
                  <span className={styles.statValue}>
                    {item.averageScore || 0}%
                  </span>
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
                    title={`Review ${labels.singular}`}
                    onClick={() => handleReviewItem(item.id)}
                    disabled={reviewingId === item.id}
                  >
                    <Eye size={16} />
                  </button>
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

      {reviewItem ? (
        <div className={styles.reviewOverlay}>
          <div className={styles.reviewModal}>
            <div className={styles.reviewHeader}>
              <div>
                <h2>{reviewItem.title}</h2>
                <p>
                  {reviewItem.unitCode} • {reviewItem.assignedProgramme} •{" "}
                  {reviewItem.creationMode === "manual" ? "Manual" : "AI"}{" "}
                  {labels.singular}
                </p>
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setReviewItem(null)}
              >
                Close
              </button>
            </div>

            <div className={styles.reviewContent}>
              <div className={styles.reviewPanel}>
                <h3>Source Document</h3>
                <p>{reviewItem.originalFileName || "Uploaded PDF"}</p>
                {reviewItem.pdfUrl ? (
                  <iframe
                    className={styles.reviewPdf}
                    src={reviewItem.pdfUrl}
                    title={reviewItem.originalFileName || reviewItem.title}
                  />
                ) : (
                  <p className={styles.reviewEmpty}>
                    No PDF available for this {labels.singular}.
                  </p>
                )}
              </div>

              <div className={styles.reviewPanel}>
                <h3>Questions and Answers</h3>
                <div className={styles.reviewQuestions}>
                  {(reviewItem.questions || []).map((question, index) => (
                    <div
                      key={question.id || index}
                      className={styles.reviewQuestionCard}
                    >
                      <strong>
                        {index + 1}. {question.prompt}
                      </strong>
                      <div className={styles.reviewOptions}>
                        {(question.options || []).map((option) => (
                          <div
                            key={option.id}
                            className={`${styles.reviewOption} ${
                              option.isCorrect ? styles.correctOption : ""
                            }`}
                          >
                            <span>{option.id.toUpperCase()}.</span>
                            <span>{option.text}</span>
                          </div>
                        ))}
                      </div>
                      <p className={styles.reviewExplanation}>
                        Correct answer:{" "}
                        {String(question.correctOptionId || "").toUpperCase()} •{" "}
                        {question.points} pts
                      </p>
                      <p className={styles.reviewExplanation}>
                        {question.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SimulationManagement;
