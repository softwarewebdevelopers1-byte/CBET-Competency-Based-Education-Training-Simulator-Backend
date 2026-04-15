import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiFileText,
  FiUser,
  FiCalendar,
  FiBookOpen,
  FiClock,
  FiAward,
  FiDownload,
  FiX,
  FiExternalLink,
  FiLayers,
} from "react-icons/fi";
import styles from "../css/courseDetail.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://cbet-competency-based-education-training.onrender.com";

export function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingPdf, setViewingPdf] = useState(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/auth/admin/upload/courses/units/${courseId}/documents`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 403 && data.needsRegistration) {
            setNeedsRegistration(true);
            setLoading(false);
            return;
          }
          throw new Error(
            data.message || data.error || "Unable to load course documents",
          );
        }

        setUnit(data.unit || null);
        setDocuments(data.documents || []);
        setNeedsRegistration(false);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load course documents",
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadDocuments();
    }
  }, [courseId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleRegisterUnit = async () => {
    try {
      setRegistering(true);
      setError("");
      
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/upload/courses/units/${courseId}/register`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to register unit");
      }

      // Registration successful, reload the page to fetch documents
      setNeedsRegistration(false);
      
      // Trigger a re-render/fetch logic
      navigate(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleOpenPdf = (doc) => {
    setViewingPdf(doc);
  };

  const handleClosePdf = () => {
    setViewingPdf(null);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading course materials...</p>
      </div>
    );
  }

  return (
    <div className={styles.courseDetailPage}>
      {/* Back navigation */}
      <button
        className={styles.backButton}
        onClick={() => navigate("/courses")}
        type="button"
      >
        <FiArrowLeft /> Back to Courses
      </button>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Unit hero header */}
      {unit && (
        <div className={styles.unitHero}>
          <span className={styles.unitCode}>{unit.unitCode}</span>
          <h1 className={styles.unitTitle}>{unit.unitName}</h1>
          <div className={styles.unitMeta}>
            <span className={styles.metaItem}>
              <FiBookOpen size={15} />
              {unit.courseTitle}
            </span>
            <span className={styles.metaItem}>
              <FiLayers size={15} />
              {unit.department}
            </span>
            <span className={styles.metaItem}>
              <FiUser size={15} />
              {unit.lecturerName || "Not assigned"}
            </span>
            <span className={styles.metaItem}>
              <FiCalendar size={15} />
              Year {unit.yearOfStudy}
            </span>
          </div>
        </div>
      )}

      {needsRegistration ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔒</div>
          <h3 className={styles.emptyTitle}>Registration Required</h3>
          <p className={styles.emptyText} style={{ marginBottom: "1.5rem" }}>
            You need to register for this unit to view its materials and assessments.
          </p>
          <button
            onClick={handleRegisterUnit}
            disabled={registering}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              fontWeight: 600,
              border: "none",
              cursor: registering ? "not-allowed" : "pointer",
              opacity: registering ? 0.7 : 1,
            }}
          >
            {registering ? "Registering..." : "Register Now"}
          </button>
        </div>
      ) : (
        <>
          {/* Documents section */}
          <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Course Materials</h2>
        <span className={styles.docCount}>
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {documents.length > 0 ? (
        <div className={styles.documentsGrid}>
          {documents.map((doc) => (
            <div
              key={doc._id}
              className={styles.documentCard}
              onClick={() => handleOpenPdf(doc)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleOpenPdf(doc);
              }}
            >
              <div className={styles.cardTop}>
                <div className={styles.pdfIcon}>PDF</div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.docTitle}>{doc.title}</h3>
                  {doc.description && (
                    <p className={styles.docDescription}>{doc.description}</p>
                  )}
                </div>
              </div>

              <div className={styles.cardStats}>
                {doc.questionCount > 0 && (
                  <span className={styles.statChip}>
                    <FiFileText size={12} />
                    {doc.questionCount} questions
                  </span>
                )}
                {doc.totalPoints > 0 && (
                  <span className={styles.statChipGreen}>
                    <FiAward size={12} />
                    {doc.totalPoints} pts
                  </span>
                )}
                {doc.estimatedTimeMinutes > 0 && (
                  <span className={styles.statChipAmber}>
                    <FiClock size={12} />
                    {doc.estimatedTimeMinutes} min
                  </span>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div>
                  <span className={styles.uploadedBy}>
                    <FiUser size={11} /> {doc.uploadedByName}
                  </span>
                  <br />
                  <span className={styles.uploadDate}>
                    {formatDate(doc.createdAt)}
                  </span>
                </div>
                <button
                  className={styles.viewBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPdf(doc);
                  }}
                  type="button"
                >
                  <FiExternalLink size={14} /> View PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <h3 className={styles.emptyTitle}>No documents uploaded yet</h3>
          <p className={styles.emptyText}>
            Your lecturer hasn't uploaded any materials for this unit yet. Check
            back later!
          </p>
        </div>
      )}
      </>
      )}

      {/* In-app PDF viewer overlay */}
      {viewingPdf && (
        <div className={styles.pdfOverlay}>
          <div className={styles.pdfHeader}>
            <div className={styles.pdfHeaderLeft}>
              <span className={styles.pdfHeaderTitle}>
                {viewingPdf.title}
              </span>
            </div>
            <div className={styles.pdfHeaderActions}>
              <a
                className={styles.pdfActionBtn}
                href={viewingPdf.pdfUrl}
                target="_blank"
                rel="noreferrer"
                download
              >
                <FiDownload size={14} /> Download
              </a>
              <a
                className={styles.pdfActionBtn}
                href={viewingPdf.pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FiExternalLink size={14} /> New Tab
              </a>
              <button
                className={styles.pdfCloseBtn}
                onClick={handleClosePdf}
                type="button"
              >
                <FiX size={14} /> Close
              </button>
            </div>
          </div>
          <div className={styles.pdfBody}>
            <iframe
              className={styles.pdfIframe}
              src={viewingPdf.pdfUrl}
              title={viewingPdf.title}
            />
          </div>
        </div>
      )}
    </div>
  );
}
