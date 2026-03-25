// src/components/common/ErrorPage.jsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/error.module.css";
import { 
  FiAlertTriangle, 
  FiHome, 
  FiRefreshCw, 
  FiArrowLeft,
  FiMail,
  FiFrown
} from "react-icons/fi";

export function ErrorPage({ 
  type = "404", 
  message = "The page you're looking for doesn't exist or has been moved.",
  title,
  showHomeButton = true,
  showRefreshButton = true,
  showBackButton = true
}) {
  const navigate = useNavigate();

  const errorConfig = {
    "404": {
      icon: <FiFrown className={styles.errorIcon} />,
      title: "Page Not Found",
      defaultMessage: "The page you're looking for doesn't exist or has been moved.",
      code: "404"
    },
    "500": {
      icon: <FiAlertTriangle className={styles.errorIcon} />,
      title: "Server Error",
      defaultMessage: "Something went wrong on our end. Please try again later.",
      code: "500"
    },
    "403": {
      icon: <FiAlertTriangle className={styles.errorIcon} />,
      title: "Access Denied",
      defaultMessage: "You don't have permission to access this page.",
      code: "403"
    },
    "401": {
      icon: <FiAlertTriangle className={styles.errorIcon} />,
      title: "Unauthorized",
      defaultMessage: "Please log in to access this page.",
      code: "401"
    },
    "400": {
      icon: <FiAlertTriangle className={styles.errorIcon} />,
      title: "Bad Request",
      defaultMessage: "The request could not be understood by the server.",
      code: "400"
    },
    "network": {
      icon: <FiAlertTriangle className={styles.errorIcon} />,
      title: "Network Error",
      defaultMessage: "Unable to connect to the server. Please check your internet connection.",
      code: "Network Error"
    },
    "maintenance": {
      icon: <FiAlertTriangle className={styles.errorIcon} />,
      title: "Under Maintenance",
      defaultMessage: "We're currently performing scheduled maintenance. Please check back soon.",
      code: "Maintenance"
    }
  };

  const config = errorConfig[type] || errorConfig["404"];
  const displayTitle = title || config.title;
  const displayMessage = message || config.defaultMessage;

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleReport = () => {
    window.location.href = "mailto:support@cbetsimulator.com?subject=Error Report&body=Please describe what happened:";
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        {/* Error Code */}
        <div className={styles.errorCode}>{config.code}</div>

        {/* Icon */}
        <div className={styles.iconWrapper}>
          {config.icon}
        </div>

        {/* Title */}
        <h1 className={styles.errorTitle}>{displayTitle}</h1>

        {/* Message */}
        <p className={styles.errorMessage}>{displayMessage}</p>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {showBackButton && (
            <button 
              onClick={handleGoBack} 
              className={`${styles.actionButton} ${styles.secondaryButton}`}
            >
              <FiArrowLeft /> Go Back
            </button>
          )}

          {showRefreshButton && (
            <button 
              onClick={handleRefresh} 
              className={`${styles.actionButton} ${styles.secondaryButton}`}
            >
              <FiRefreshCw /> Refresh
            </button>
          )}

          {showHomeButton && (
            <Link 
              to="/" 
              className={`${styles.actionButton} ${styles.primaryButton}`}
            >
              <FiHome /> Go Home
            </Link>
          )}
        </div>

        {/* Help Section */}
        <div className={styles.helpSection}>
          <p>Need assistance?</p>
          <div className={styles.helpLinks}>
            <button onClick={handleReport} className={styles.helpLink}>
              <FiMail /> Report Problem
            </button>
            <Link to="/contact" className={styles.helpLink}>
              Contact Support
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className={styles.decorativeCircle1}></div>
        <div className={styles.decorativeCircle2}></div>
      </div>
    </div>
  );
}