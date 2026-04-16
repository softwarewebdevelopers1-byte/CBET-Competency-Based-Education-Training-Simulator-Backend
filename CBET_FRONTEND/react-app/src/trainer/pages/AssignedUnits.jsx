import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Users, Upload, X, FileText, ChevronDown, ChevronUp } from "lucide-react";
import styles from "../../admin/styles/dashboard.module.css";
import { apiClient } from "../../utils/apiClient.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://cbet-competency-based-education-training.onrender.com";

const INITIAL_UPLOAD_FORM = {
  description: "",
  instructions: "",
  file: null,
  yearOfStudy: "", // Added missing field
};

const AssignedUnits = () => {
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUnitId, setExpandedUnitId] = useState("");
  const [uploadingUnitId, setUploadingUnitId] = useState("");
  const [uploadForm, setUploadForm] = useState(INITIAL_UPLOAD_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [viewingDocsUnitId, setViewingDocsUnitId] = useState("");
  const [unitDocuments, setUnitDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const loadAssignedUnits = async (ignoreCache = false) => {
    try {
      setLoading(true);
      setError("");

      const data = await apiClient.getWithCache(
        `${API_BASE_URL}/auth/admin/upload/courses/trainer/assigned-units`,
        { method: "GET" },
        ignoreCache ? 0 : 5 * 60 * 1000
      );

      if (data.error || data.message === "Error fetching assigned units") {
        throw new Error(data.error || data.message || "Unable to fetch assigned units");
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

  useEffect(() => {
    loadAssignedUnits();
  }, []);

  const studentTotal = useMemo(
    () =>
      assignedUnits.reduce(
        (sum, unit) => sum + (unit.studentCount || 0),
        0,
      ),
    [assignedUnits],
  );

  const handleToggleExpand = (unitId) => {
    setExpandedUnitId((current) => (current === unitId ? "" : unitId));
  };

  // Fixed: This was a misplaced function - it was partially defined incorrectly
  const handleOpenUpload = (unitId) => {
    setUploadingUnitId((current) => (current === unitId ? "" : unitId));
    if (uploadingUnitId !== unitId) {
      setViewingDocsUnitId("");
      setExpandedUnitId("");
    }
    setUploadForm(INITIAL_UPLOAD_FORM);
    setUploadError("");
    setUploadSuccess("");
  };

  const handleToggleViewDocs = (unitId) => {
    if (viewingDocsUnitId === unitId) {
      setViewingDocsUnitId("");
      setUnitDocuments([]);
    } else {
      setViewingDocsUnitId(unitId);
      setUploadingUnitId("");
      setExpandedUnitId("");
      fetchUnitDocuments(unitId);
    }
  };

  const fetchUnitDocuments = async (unitId) => {
    try {
      setLoadingDocs(true);
      const response = await fetch(`${API_BASE_URL}/auth/admin/upload/courses/units/${unitId}/documents`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();

      const allDocs = [...(data.documents || []), ...(data.assessments || []), ...(data.materials || [])];
      const uniqueIds = new Set();
      const uniqueDocs = allDocs.filter(d => {
        const id = d._id || d.id;
        if (uniqueIds.has(id)) return false;
        uniqueIds.add(id);
        return true;
      });

      setUnitDocuments(uniqueDocs);
    } catch (err) {
      console.error(err);
      alert("Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.originalFileName || doc.title || 'this document'}"?`)) return;
    try {
      let endpoint = `${API_BASE_URL}/api/resources/materials/${doc._id || doc.id}`;
      let res = await fetch(endpoint, { method: "DELETE", credentials: "include" });

      if (res.status === 404 || !res.ok) {
        endpoint = `${API_BASE_URL}/api/resources/assessments/${doc._id || doc.id}`;
        res = await fetch(endpoint, { method: "DELETE", credentials: "include" });
      }

      if (!res.ok) throw new Error("Failed to delete document");

      apiClient.invalidatePattern("documents");
      setUnitDocuments(prev => prev.filter(d => (d._id || d.id) !== (doc._id || doc.id)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadChange = (event) => {
    const { name, value, files } = event.target;
    setUploadForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handleUploadSubmit = async (event, unit) => {
    event.preventDefault();
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const payload = new FormData();
      payload.append("courseTitle", unit.courseTitle);
      payload.append("unitName", unit.unitName);
      payload.append("unitCode", unit.unitCode);
      payload.append("assignedProgramme", unit.courseTitle);
      payload.append("assignedDepartment", unit.department || "");
      payload.append("yearOfStudy", String(uploadForm.yearOfStudy || unit.yearOfStudy || 1));
      payload.append("activityType", "document");

      if (uploadForm.description) {
        payload.append("description", uploadForm.description);
      }
      if (uploadForm.instructions) {
        payload.append("instructions", uploadForm.instructions);
      }
      if (uploadForm.file) {
        payload.append("file", uploadForm.file);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/resources/materials`,
        {
          method: "POST",
          credentials: "include",
          body: payload,
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to upload document");
      }

      setUploadSuccess(data.message || "Document uploaded successfully!");
      setUploadForm(INITIAL_UPLOAD_FORM);
      
      apiClient.invalidatePattern("documents");

      setTimeout(() => {
        setUploadingUnitId("");
        setUploadSuccess("");
        // Refresh documents if viewing docs for this unit
        if (viewingDocsUnitId === unit._id) {
          fetchUnitDocuments(unit._id);
        }
      }, 3000);
    } catch (submitError) {
      setUploadError(
        submitError instanceof Error ? submitError.message : "Unable to upload document",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`${styles.dashboard} ${loading ? styles.loading : ""}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Assigned Units</h1>
          <p className={styles.pageSubtitle}>
            View your assigned units, see registered students, and upload course materials.
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
            <span className={styles.statValue}>{studentTotal}</span>
            <span className={styles.statHelper}>Students across all your assigned units</span>
          </div>
        </div>
      </div>

      <div className={styles.dataCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Unit Roster</h3>
            <p>Each assigned unit, registered students, and document upload.</p>
          </div>
        </div>

        {assignedUnits.length > 0 ? (
          <div className={styles.userList}>
            {assignedUnits.map((unit) => (
              <div key={unit._id} className={styles.userListItem}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%" }}>
                  <div className={styles.userAvatar}>{unit.unitCode?.slice(0, 2) || "UN"}</div>
                  <div className={styles.userListContent} style={{ flex: 1 }}>
                    <span className={styles.userListName}>
                      {unit.unitCode} - {unit.unitName}
                    </span>
                    <span className={styles.userListMeta}>
                      {unit.courseTitle} • {unit.department} • Year {unit.yearOfStudy}
                    </span>
                    <span className={styles.userListMeta}>
                      {unit.studentCount || 0} student{unit.studentCount === 1 ? "" : "s"} registered
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      onClick={() => handleOpenUpload(unit._id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.45rem 0.85rem",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: uploadingUnitId === unit._id
                          ? "rgba(239,68,68,0.1)"
                          : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: uploadingUnitId === unit._id ? "#ef4444" : "white",
                        transition: "all 0.2s ease",
                      }}
                      type="button"
                    >
                      {uploadingUnitId === unit._id ? (
                        <><X size={14} /> Close</>
                      ) : (
                        <><Upload size={14} /> Upload PDF</>
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleExpand(unit._id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.45rem 0.85rem",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: "transparent",
                        color: "#6366f1",
                        transition: "all 0.2s ease",
                      }}
                      type="button"
                    >
                      {expandedUnitId === unit._id ? (
                        <><ChevronUp size={14} /> Hide Students</>
                      ) : (
                        <><ChevronDown size={14} /> View Students</>
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleViewDocs(unit._id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.45rem 0.85rem",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: viewingDocsUnitId === unit._id ? "rgba(16, 185, 129, 0.1)" : "transparent",
                        color: "#10b981",
                        transition: "all 0.2s ease",
                      }}
                      type="button"
                    >
                      <FileText size={14} /> {viewingDocsUnitId === unit._id ? "Hide Docs" : "Manage Docs"}
                    </button>
                  </div>
                </div>

                {/* Upload form */}
                {uploadingUnitId === unit._id && (
                  <div style={{
                    width: "100%",
                    marginTop: "1rem",
                    padding: "1.25rem",
                    borderRadius: "12px",
                    background: "rgba(99,102,241,0.04)",
                    border: "1px solid rgba(99,102,241,0.12)",
                  }}>
                    {uploadError && (
                      <div style={{
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        background: "rgba(239,68,68,0.08)",
                        color: "#dc2626",
                        fontSize: "0.8rem",
                        marginBottom: "0.75rem",
                        fontWeight: 500,
                      }}>
                        {uploadError}
                      </div>
                    )}
                    {uploadSuccess && (
                      <div style={{
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        background: "rgba(34,197,94,0.08)",
                        color: "#16a34a",
                        fontSize: "0.8rem",
                        marginBottom: "0.75rem",
                        fontWeight: 500,
                      }}>
                        {uploadSuccess}
                      </div>
                    )}
                    <form onSubmit={(e) => handleUploadSubmit(e, unit)}>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                      }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.3rem" }}>
                            PDF File *
                          </label>
                          <input
                            type="file"
                            name="file"
                            accept="application/pdf"
                            onChange={handleUploadChange}
                            required
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              borderRadius: "8px",
                              border: "1px solid rgba(99,102,241,0.2)",
                              fontSize: "0.8rem",
                              background: "white",
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.3rem" }}>
                            Description (optional)
                          </label>
                          <textarea
                            name="description"
                            rows="2"
                            value={uploadForm.description}
                            onChange={handleUploadChange}
                            placeholder="Brief description of this document..."
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              borderRadius: "8px",
                              border: "1px solid rgba(99,102,241,0.2)",
                              fontSize: "0.8rem",
                              resize: "vertical",
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <button
                          type="submit"
                          disabled={uploading}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.5rem 1.25rem",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: uploading ? "not-allowed" : "pointer",
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "white",
                            opacity: uploading ? 0.7 : 1,
                          }}
                        >
                          <Upload size={14} />
                          {uploading ? "Uploading document..." : "Upload PDF"}
                        </button>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                          Pre-filled: {unit.unitCode} • {unit.unitName} • {unit.courseTitle}
                        </span>
                      </div>
                    </form>
                  </div>
                )}

                {/* Manage Documents */}
                {viewingDocsUnitId === unit._id && (
                  <div style={{
                    width: "100%",
                    marginTop: "1rem",
                    padding: "1.25rem",
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.04)",
                    border: "1px solid rgba(16, 185, 129, 0.12)",
                  }}>
                    <h4 style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#065f46" }}>Uploaded Documents for {unit.unitCode}</h4>
                    {loadingDocs ? (
                      <p style={{ color: "#047857", fontSize: "0.85rem" }}>Loading documents...</p>
                    ) : unitDocuments.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {unitDocuments.map(doc => (
                          <div key={doc._id || doc.id} style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.75rem 1rem",
                            background: "white",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                            borderRadius: "8px"
                          }}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ display: "block", fontSize: "0.85rem", color: "#334155" }}>{doc.originalFileName || doc.title || "Document"}</strong>
                              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{doc.description || "No description"}</span>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              {doc.pdfUrl && (
                                <a href={doc.pdfUrl} target="_blank" rel="noreferrer" style={{
                                  fontSize: "0.75rem", padding: "0.4rem 0.75rem", background: "#f1f5f9", color: "#475569", borderRadius: "6px", textDecoration: "none", fontWeight: 600
                                }}>View</a>
                              )}
                              <button onClick={() => handleDeleteDocument(doc)} style={{
                                fontSize: "0.75rem", padding: "0.4rem 0.75rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600
                              }}>Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No documents uploaded for this unit yet.</p>
                    )}
                  </div>
                )}

                {/* Students list */}
                {expandedUnitId === unit._id && (
                  <div style={{
                    width: "100%",
                    marginTop: "0.75rem",
                    paddingLeft: "3.5rem",
                  }}>
                    {unit.students?.length > 0 ? (
                      unit.students.map((student) => (
                        <div
                          key={student.userNumber}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 0",
                            borderBottom: "1px solid rgba(226,232,240,0.5)",
                            fontSize: "0.82rem",
                          }}
                        >
                          <div style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {student.fullName?.charAt(0) || "S"}
                          </div>
                          <span style={{ fontWeight: 600 }}>{student.fullName}</span>
                          <span style={{ color: "#94a3b8" }}>({student.userNumber})</span>
                          {student.registeredAt && (
                            <span style={{ color: "#94a3b8", marginLeft: "auto", fontSize: "0.75rem" }}>
                              Registered {new Date(student.registeredAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                        No students registered yet
                      </p>
                    )}
                  </div>
                )}
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
