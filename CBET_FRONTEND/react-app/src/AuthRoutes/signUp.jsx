// src/components/auth/SignUpRoute.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../css/signup.module.css";
import { FiUser, FiMail, FiLock, FiUserPlus } from "react-icons/fi";

export function SignUpRoute() {
  const [fullName, setFullName] = useState("");
  const [UserNumber, setUserNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    if (!fullName || !UserNumber || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const UserNumberRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!UserNumberRegex.test(UserNumber)) {
      setError("Please enter a valid UserNumber address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");
    (async () => {
      console.log(UserNumber, password);

      try {
        let res = await fetch("https://cbet-competency-based-education-training.onrender.com/auth/signUp", {
          method: "POST",
          body: JSON.stringify({ UserNumber, password }),
          credentials: "include",
        });
        console.log(await res.json());

        if (res.ok) {
          setTimeout(() => {
            setSuccess(true);
            setLoading(false);

            // Redirect to login after 2 seconds
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }, 1000);
        }
      } catch (error) {
      } finally {
        setLoading(false);
        setError("");
      }
    })();
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.success}>
            <h2>Registration Successful!</h2>
            <p>Your account has been created.</p>
            <p>Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Create Account</h1>
          <p>Join CBET Simulator today</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="fullName">Full Name</label>
            <div className={styles.inputWrapper}>
              <FiUser className={styles.icon} />
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="UserNumber">UserNumber</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.icon} />
              <input
                type="UserNumber"
                id="UserNumber"
                value={UserNumber}
                onChange={(e) => {
                  setUserNumber(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your UserNumber"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.icon} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Create a password"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.icon} />
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Confirm your password"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
            {!loading && <FiUserPlus />}
          </button>
        </form>

        <div className={styles.links}>
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
