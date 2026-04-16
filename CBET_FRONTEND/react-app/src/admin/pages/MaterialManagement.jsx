import React, { useEffect, useState } from "react";
import { FileText, Trash2, RefreshCw, Eye } from "lucide-react";
import styles from "../styles/simulationManagement.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://cbet-competency-based-education-training.onrender.com";

const formatDate = (value) => {
  if (!value) return "Just now";
  return new Date(value).toLocaleString();
};

const MaterialManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`${API_BASE_URL}/api/resources/materials/admin`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load materials");
      }

      setMaterials(data.materials || []);
    } catch (err) {
      setError(err.message || "Unable to load materials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleDelete = async (material) => {
    if (!window.confirm(`Are you sure you want to delete the material "${material.originalFileName || "document"}"? This will permanently remove it from storage.`)) return;

    try {
      setDeletingId(material._id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE_URL}/api/resources/materials/${material._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete material");
      }

      setMaterials((current) => current.filter((m) => m._id !== material._id));
      setSuccess("Material deleted successfully");
      
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Unable to delete material");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className={styles.simulationManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Course Materials Management</h1>
          <p className={styles.pageDescription}>
            View and manage standard course documents uploaded by trainers and staff.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={loadMaterials} type="button">
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className={styles.alertError}>{error}</div> : null}
      {success ? <div className={styles.alertSuccess}>{success}</div> : null}

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading course materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={80} />
          <h3>No Materials Found</h3>
          <p>There are no regular course materials uploaded yet.</p>
        </div>
      ) : (
        <div className={styles.simulationsGrid}>
          {materials.map((item) => (
            <div key={item._id} className={styles.simulationCard}>
              <div className={styles.cardHeader}>
                <span className={`${styles.simType} ${styles.technical}`}>
                  {item.unitCode}
                </span>
                <span className={`${styles.simStatus} ${styles.active}`}>
                  Material
                </span>
              </div>

              <h3 style={{ wordBreak: "break-word", fontSize: "1rem" }}>{item.originalFileName || "Document"}</h3>
              <p className={styles.cardMeta}>
                 {item.courseTitle} • Year {item.yearOfStudy}
              </p>

              <div className={styles.simStats}>
                <div className={styles.stat}>
                   <span className={styles.statLabel}>Uploaded By</span>
                   <span className={styles.statValue} style={{ fontSize: "0.85rem" }}>{item.uploadedByName || item.from}</span>
                </div>
              </div>

              {item.description && (
                  <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#64748b" }}>
                     “{item.description}”
                  </div>
              )}

              <div className={styles.cardFooter} style={{ marginTop: "1.5rem" }}>
                <span className={styles.lastUpdated}>
                  Uploaded {formatDate(item.createdAt)}
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
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    type="button"
                    title="Delete Material"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item._id}
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

export default MaterialManagement;
