// src/components/auth/LoginRoute.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../css/login.module.css";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";

export function LoginRoute() {
  const [UserNumber, setUserNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!UserNumber || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:8000/user/auth/now/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ UserNumber, password }),
        },
      );

      const data = await response.json();
      console.log(data);

      if (data.role === "student") {
        setError("Login successful! Redirecting...");
        localStorage.setItem("cbet_user", JSON.stringify(data));
        navigate("/dashboard");
      } else if (data.role === "trainer") {
        localStorage.setItem("cbet_user", JSON.stringify(data));
        navigate("/trainer/dashboard");
      } else if (data.role === "admin") {
        localStorage.setItem("cbet_user", JSON.stringify(data));
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>CBET Simulator</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="UserNumber">UserNumber</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.icon} />
              <input
                type="text"
                id="UserNumber"
                name="UserNumber"
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
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <FiLogIn />}
          </button>
        </form>

        <div className={styles.links}>
          {/* <Link to="/signup">Create an account</Link> */}
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <div className={styles.demo}>
          <p>Welcome Back</p>
        </div>
      </div>
    </div>
  );
}
