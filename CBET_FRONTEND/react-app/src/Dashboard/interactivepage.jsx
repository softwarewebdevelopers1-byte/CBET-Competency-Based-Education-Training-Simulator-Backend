import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "../css/scenario.module.css";
import {
  FiPlayCircle,
  FiClock,
  FiAward,
  FiStar,
  FiChevronLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiUsers,
  FiRefreshCw,
  FiFileText,
} from "react-icons/fi";

export function InteractiveScenario() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSimulationId = searchParams.get("simulationId");

  const [loading, setLoading] = useState(true);
  const [simulations, setSimulations] = useState([]);
  const [scenario, setScenario] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSimulations = async () => {
    const response = await fetch(
      "http://localhost:8000/api/resources/upload/users/data/pdf/student",
      {
        method: "GET",
        credentials: "include",
      },
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load simulations");
    }

    setSimulations(data.simulations || []);
  };

  const loadScenario = async (simulationId) => {
    const response = await fetch(
      `http://localhost:8000/api/resources/upload/users/data/pdf/student/${simulationId}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load selected simulation");
    }

    setScenario(data.simulation);
    setResults(data.simulation?.previousResult || null);
    const existingAnswers = (data.simulation?.previousResult?.feedback || []).reduce(
      (current, item) => ({
        ...current,
        [item.questionIndex]: item.selectedOptionId || "",
      }),
      {},
    );
    setAnswers(existingAnswers);
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        await loadSimulations();

        if (selectedSimulationId) {
          await loadScenario(selectedSimulationId);
        } else {
          setScenario(null);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error.message || "Unable to load simulations");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [selectedSimulationId]);

  const handleStart = (simulationId) => {
    setSearchParams({ simulationId });
  };

  const handleBackToList = () => {
    setSearchParams({});
    setScenario(null);
    setResults(null);
    setAnswers({});
  };

  const handleAnswerChange = (questionIndex, optionId) => {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!scenario || scenario.isCompleted) return;

    try {
      setSubmitting(true);
      setErrorMessage("");
      const payload = {
        answers: scenario.questions.map((question, index) => ({
          questionIndex: index,
          selectedOptionId: answers[index] || "",
        })),
      };

      const response = await fetch(
        `http://localhost:8000/api/resources/upload/users/data/pdf/student/${scenario.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.result) {
          setResults(data.result);
          setScenario((current) =>
            current ? { ...current, isCompleted: true } : current,
          );
          await loadSimulations();
        }
        throw new Error(data.error || "Unable to submit answers");
      }

      setResults(data.result);
      setScenario((current) =>
        current ? { ...current, isCompleted: true } : current,
      );
      await loadSimulations();
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit answers");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading simulations...</p>
      </div>
    );
  }

  if (!selectedSimulationId || !scenario) {
    return (
      <div className={styles.scenarioContainer}>
        <div className={styles.catalogSection}>
          <div className={styles.catalogHeader}>
            <div>
              <h1>AI Simulations</h1>
              <p>Answer the questions generated from your trainer's uploaded PDF.</p>
            </div>
          </div>

          {errorMessage ? <div className={styles.inlineAlert}>{errorMessage}</div> : null}

          {simulations.length === 0 ? (
            <div className={styles.emptyPanel}>
              <FiFileText />
              <h3>No simulations assigned yet</h3>
              <p>Your admin has not uploaded a PDF for your course yet.</p>
            </div>
          ) : (
            <div className={styles.catalogGrid}>
              {simulations.map((simulation) => (
                <article key={simulation.id} className={styles.catalogCard}>
                  <div className={styles.catalogMeta}>
                    <span>{simulation.course}</span>
                    <span>{simulation.status}</span>
                  </div>
                  <h3>{simulation.title}</h3>
                  <p>{simulation.description}</p>
                  <div className={styles.catalogStats}>
                    <span>
                      <FiFileText /> {simulation.questionCount} questions
                    </span>
                    <span>
                      <FiAward /> {simulation.totalPoints} pts
                    </span>
                    <span>
                      <FiClock /> {simulation.estimatedTimeMinutes} mins
                    </span>
                  </div>
                  <div className={styles.catalogStats}>
                    <span>
                      <FiUsers /> {simulation.participants} attempts
                    </span>
                    <span>
                      <FiBarChart2 /> Avg {simulation.averageScore || 0}%
                    </span>
                  </div>
                  {simulation.score !== null ? (
                    <div className={styles.previousScore}>
                      Completed: {simulation.score}/{simulation.totalPoints} (
                      {simulation.percentage}%)
                    </div>
                  ) : null}
                  {simulation.score !== null ? (
                    <div className={styles.completedNote}>
                      You have already completed this simulation. Open it to view
                      your result.
                    </div>
                  ) : null}
                  <button
                    className={styles.startSimulationBtn}
                    onClick={() => handleStart(simulation.id)}
                  >
                    {simulation.score !== null ? <FiCheckCircle /> : <FiPlayCircle />}
                    {simulation.score !== null ? "View Results" : "Start"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <div className={styles.scenarioContainer}>
      <div className={styles.scenarioHeader}>
        <div className={styles.headerLeft}>
          <button onClick={handleBackToList} className={styles.backBtn}>
            <FiChevronLeft /> Back
          </button>
          <div className={styles.scenarioInfo}>
            <h1>{scenario.title}</h1>
            <div className={styles.scenarioMeta}>
              <span className={styles.metaItem}>
                <FiBarChart2 /> {scenario.courseTitle}
              </span>
              <span className={styles.metaItem}>
                <FiUsers /> {scenario.questionCount} questions
              </span>
              <span className={styles.metaItem}>
                <FiStar /> {scenario.totalPoints} points
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${(answeredCount / Math.max(scenario.questions.length, 1)) * 100}%`,
          }}
        ></div>
      </div>

      <div className={styles.scenarioMain}>
        <div className={styles.scenarioContent}>
          <div className={styles.stageIndicator}>
            <span className={styles.stageNumber}>
              {scenario.unitCode} • {scenario.questionCount} Questions
            </span>
            <h2 className={styles.stageTitle}>{scenario.description}</h2>
            <p className={styles.scenarioBodyCopy}>
              {scenario.instructions}
            </p>
          </div>

          {errorMessage ? <div className={styles.inlineAlert}>{errorMessage}</div> : null}

          {scenario.isCompleted ? (
            <div className={styles.completedPanel}>
              <div className={styles.feedbackHeader}>
                <FiCheckCircle className={styles.feedbackIcon} />
                <span className={styles.feedbackTitle}>Simulation Completed</span>
              </div>
              <p>
                You can review the questions and your selected answers below, but
                you cannot retake this simulation.
              </p>
            </div>
          ) : null}

          {scenario.questions.map((question, index) => (
            <section key={question.id} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <span className={styles.questionBadge}>Question {index + 1}</span>
                <span className={styles.questionPoints}>{question.points} pts</span>
              </div>
              <h3 className={styles.questionPrompt}>{question.prompt}</h3>
              <div className={styles.options}>
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`${styles.optionBtn} ${
                      answers[index] === option.id ? styles.optionSelected : ""
                    } ${scenario.isCompleted ? styles.optionLocked : ""}`}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option.id}
                      checked={answers[index] === option.id}
                      onChange={() => handleAnswerChange(index, option.id)}
                      className={styles.optionInput}
                      disabled={scenario.isCompleted}
                    />
                    <span className={styles.optionLetter}>
                      {option.id.toUpperCase()}
                    </span>
                    <span className={styles.optionText}>{option.text}</span>
                  </label>
                ))}
              </div>
            </section>
          ))}

          {!scenario.isCompleted ? (
            <button
              className={styles.submitSimulationBtn}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting Answers..." : "Submit Answers"}
            </button>
          ) : null}

          {results && !scenario?.isCompleted ? (
            <div className={styles.resultsInline}>
              <div className={styles.feedbackHeader}>
                <FiCheckCircle className={styles.feedbackIcon} />
                <span className={styles.feedbackTitle}>Results Ready</span>
              </div>
              <p>
                You scored {results.score}/{results.totalPoints} ({results.percentage}
                %).
              </p>
              <div className={styles.reviewList}>
                {results.feedback.map((item) => (
                  <div key={item.questionIndex} className={styles.reviewItem}>
                    <strong>Question {item.questionIndex + 1}:</strong>{" "}
                    {item.isCorrect ? "Correct" : "Incorrect"} • +
                    {item.pointsAwarded} pts
                    <div>{item.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.scenarioSidebar}>
          <div className={styles.timerCard}>
            <FiClock className={styles.timerIcon} />
            <div className={styles.timerInfo}>
              <span className={styles.timerLabel}>Estimated Time</span>
              <span className={styles.timerValue}>
                {scenario.estimatedTimeMinutes} mins
              </span>
            </div>
          </div>

          <div className={styles.scoreCard}>
            <FiAward className={styles.scoreIcon} />
            <div className={styles.scoreInfo}>
              <span className={styles.scoreLabel}>Points Available</span>
              <span className={styles.scoreValue}>
                {results ? results.score : answeredCount}/{scenario.totalPoints}
              </span>
            </div>
          </div>

          <div className={styles.objectivesCard}>
            <h3>Learning Objectives</h3>
            <ul className={styles.objectivesList}>
              {scenario.learningObjectives.map((objective, index) => (
                <li key={index}>
                  <FiCheckCircle className={styles.objectiveIcon} />
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.actionsCard}>
            <a
              className={styles.actionBtn}
              href={scenario.pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              <FiFileText /> Open Source PDF
            </a>
            <button className={styles.actionBtn} onClick={handleBackToList}>
              <FiRefreshCw /> Browse More
            </button>
          </div>

          {scenario.previousAttempt ? (
            <div className={styles.previousAttemptCard}>
              <h3>Your Result</h3>
              <p>
                {scenario.previousAttempt.score}/{scenario.totalPoints} (
                {scenario.previousAttempt.percentage}%)
              </p>
              <span>
                Submitted{" "}
                {new Date(scenario.previousAttempt.submittedAt).toLocaleString()}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
