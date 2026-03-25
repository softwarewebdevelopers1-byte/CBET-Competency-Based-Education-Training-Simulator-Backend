// src/components/LandingPage.jsx

import React from "react";
import { Link } from "react-router-dom";
import studentImage from "../assets/cbet_students.jpg";
import styles from "../css/landing.module.css";
import {
  FiBookOpen,
  FiVideo,
  FiCpu,
  FiFolder,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiLogIn,
  FiUserPlus,
  FiChevronRight,
} from "react-icons/fi";

export function LandingPage() {
  return (
    <div className={styles.landingContainer}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎓</span>
            <span className={styles.logoText}>CBET Simulator</span>
          </div>
          <div className={styles.navLinks}>
            <Link to="/login" className={styles.loginBtn}>
              <FiLogIn /> Login
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              <FiUserPlus /> Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Competency-Based Education & Training Simulator
          </h1>
          <p className={styles.heroSubtitle}>
            Empowering Kenya's TVET institutions with interactive learning,
            AI-powered assessments, and real-time progress tracking
          </p>
          <div className={styles.heroButtons}>
            <Link to="/signup" className={styles.primaryBtn}>
              Get Started <FiChevronRight />
            </Link>
            <Link to="/about" className={styles.secondaryBtn}>
              Learn More
            </Link>
          </div>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>50+</span>
              <span className={styles.statLabel}>TVET Institutions</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>10,000+</span>
              <span className={styles.statLabel}>Active Students</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>500+</span>
              <span className={styles.statLabel}>Interactive Scenarios</span>
            </div>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img
            src={studentImage}
            alt="Students learning"
            className={styles.heroImg}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Key Features</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need for modern competency-based education
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ background: "#e8f0fe" }}
            >
              <FiBookOpen
                className={styles.icon}
                style={{ color: "#4f46e5" }}
              />
            </div>
            <h3 className={styles.featureTitle}>Interactive Simulations</h3>
            <p className={styles.featureDescription}>
              Technical and ethical workplace scenarios that mimic real-world
              situations
            </p>
          </div>

          <div className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ background: "#fef3c7" }}
            >
              <FiVideo className={styles.icon} style={{ color: "#d97706" }} />
            </div>
            <h3 className={styles.featureTitle}>Learning Materials</h3>
            <p className={styles.featureDescription}>
              Upload and manage PDFs, videos, and PowerPoint presentations
            </p>
          </div>

          <div className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ background: "#d1fae5" }}
            >
              <FiCpu className={styles.icon} style={{ color: "#059669" }} />
            </div>
            <h3 className={styles.featureTitle}>AI Assessment Generation</h3>
            <p className={styles.featureDescription}>
              Automatically create tests and quizzes from uploaded materials
            </p>
          </div>

          <div className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ background: "#fae8ff" }}
            >
              <FiFolder className={styles.icon} style={{ color: "#9333ea" }} />
            </div>
            <h3 className={styles.featureTitle}>Portfolio Management</h3>
            <p className={styles.featureDescription}>
              Document and track practical work, projects, and achievements
            </p>
          </div>

          <div className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ background: "#fff3cd" }}
            >
              <FiAward className={styles.icon} style={{ color: "#e67e22" }} />
            </div>
            <h3 className={styles.featureTitle}>Gamification</h3>
            <p className={styles.featureDescription}>
              Points, badges, streaks, and leaderboards to boost engagement
            </p>
          </div>

          <div className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ background: "#d3e0ff" }}
            >
              <FiUsers className={styles.icon} style={{ color: "#2563eb" }} />
            </div>
            <h3 className={styles.featureTitle}>Multi-role System</h3>
            <p className={styles.featureDescription}>
              Dedicated interfaces for Students, Trainers, and Administrators
            </p>
          </div>

          <div className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ background: "#ffd6d6" }}
            >
              <FiTrendingUp
                className={styles.icon}
                style={{ color: "#dc2626" }}
              />
            </div>
            <h3 className={styles.featureTitle}>Real-time Progress Tracking</h3>
            <p className={styles.featureDescription}>
              Monitor learner performance with detailed analytics
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>
            Simple, intuitive, and effective learning process
          </p>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Upload Materials</h3>
            <p className={styles.stepDescription}>
              Trainers upload learning materials (PDFs, videos, presentations)
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>AI Generates Assessments</h3>
            <p className={styles.stepDescription}>
              System automatically creates tests from uploaded content
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Students Learn & Practice</h3>
            <p className={styles.stepDescription}>
              Interactive simulations, assessments, and portfolio building
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <h3 className={styles.stepTitle}>Track Progress</h3>
            <p className={styles.stepDescription}>
              Real-time analytics and gamification elements
            </p>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className={styles.roles}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Designed for Everyone</h2>
          <p className={styles.sectionSubtitle}>
            Tailored experiences for each user role
          </p>
        </div>

        <div className={styles.rolesGrid}>
          <div className={styles.roleCard}>
            <div className={styles.roleIcon}>👨‍🎓</div>
            <h3 className={styles.roleTitle}>Students</h3>
            <ul className={styles.roleFeatures}>
              <li>Access learning materials</li>
              <li>Complete interactive scenarios</li>
              <li>Take AI-generated assessments</li>
              <li>Build digital portfolio</li>
              <li>Earn badges and points</li>
            </ul>
          </div>

          <div className={styles.roleCard}>
            <div className={styles.roleIcon}>👨‍🏫</div>
            <h3 className={styles.roleTitle}>Trainers</h3>
            <ul className={styles.roleFeatures}>
              <li>Upload learning materials</li>
              <li>Generate assessments with AI</li>
              <li>Review student portfolios</li>
              <li>View class analytics</li>
              <li>Track individual progress</li>
            </ul>
          </div>

          <div className={styles.roleCard}>
            <div className={styles.roleIcon}>👨‍💼</div>
            <h3 className={styles.roleTitle}>Administrators</h3>
            <ul className={styles.roleFeatures}>
              <li>Manage all courses</li>
              <li>User account management</li>
              <li>System-wide analytics</li>
              <li>Configure gamification</li>
              <li>Generate reports</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Ready to transform TVET education?
          </h2>
          <p className={styles.ctaSubtitle}>
            Join leading institutions across Kenya using CBET Simulator
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/signup" className={styles.ctaPrimaryBtn}>
              Get Started Now
            </Link>
            <Link to="/contact" className={styles.ctaSecondaryBtn}>
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>CBET Simulator</h3>
            <p className={styles.footerText}>
              Revolutionizing TVET education through technology
            </p>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Quick Links</h3>
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/features">Features</Link>
              </li>
              <li>
                <Link to="/pricing">Pricing</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Support</h3>
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/help">Help Center</Link>
              </li>
              <li>
                <Link to="/docs">Documentation</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/status">System Status</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Legal</h3>
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
              <li>
                <Link to="/cookies">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; 2026 CBET Simulator. All rights reserved.</p>
          <p>Made with ❤️ for Kenyan TVET institutions</p>
        </div>
      </footer>
    </div>
  );
}
