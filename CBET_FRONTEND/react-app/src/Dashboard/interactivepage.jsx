// src/components/scenarios/InteractiveScenario.jsx

// src/components/scenarios/InteractiveScenario.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../css/scenario.module.css";
import {
  FiPlayCircle,
  FiClock,
  FiAward, // Used for trophies/badges
  FiStar,
  FiChevronRight,
  FiChevronLeft,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiHelpCircle,
  FiMessageCircle,
  FiBarChart2,
  FiUsers,
  FiRefreshCw,
  FiSave,
  FiShare2,
  FiVolume2,
  FiVolumeX,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";

// If you specifically need a trophy icon, you can add:
// import { FaTrophy } from "react-icons/fa";

// Rest of your component code...

export function InteractiveScenario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [hints, setHints] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Simulate loading scenario
    setTimeout(() => {
      setScenario(mockScenario);
      setTimeRemaining(mockScenario.timeLimit * 60); // Convert to seconds
      setLoading(false);
    }, 1000);
  }, [id]);

  useEffect(() => {
    // Timer countdown
    if (timeRemaining > 0 && !completed && !loading) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, completed, loading]);

  const mockScenario = {
    id: 1,
    title: "Network Security Breach Response",
    type: "technical",
    difficulty: "intermediate",
    industry: "Information Technology",
    description:
      "You are the network administrator at a medium-sized company. You've just received an alert about unusual network activity that suggests a possible security breach.",
    learningObjectives: [
      "Identify signs of a network breach",
      "Implement immediate containment measures",
      "Follow proper incident response protocols",
      "Document findings and actions taken",
    ],
    timeLimit: 15, // minutes
    totalPoints: 500,
    estimatedTime: "15-20 mins",
    participants: 1245,
    avgScore: 78,
    stages: [
      {
        id: 1,
        title: "Initial Detection",
        description:
          "You receive an alert from your IDS about multiple failed login attempts from an unusual IP address. The system shows that someone is trying to access the admin panel.",
        context:
          "Time: 2:30 PM\nLocation: Server Room\nSystem: Security Dashboard",
        options: [
          {
            id: "a",
            text: "Immediately block the IP address and investigate the logs",
            isCorrect: true,
            feedback:
              "Correct! Blocking the suspicious IP and checking logs is the first step in incident response.",
            points: 100,
            nextStage: 2,
            consequences:
              "The attacker is temporarily blocked, giving you time to investigate.",
          },
          {
            id: "b",
            text: "Ignore it, it's probably just a misconfigured system",
            isCorrect: false,
            feedback:
              "Incorrect. Never ignore security alerts, even if they seem minor.",
            points: 0,
            nextStage: 1,
            consequences:
              "The attacker continues their attempt and gains limited access.",
          },
          {
            id: "c",
            text: "Shut down the entire network immediately",
            isCorrect: false,
            feedback:
              "Too extreme. Shutting down the network causes unnecessary business disruption.",
            points: 25,
            nextStage: 1,
            consequences:
              "Business operations are disrupted, and you still need to investigate.",
          },
          {
            id: "d",
            text: "Call your manager and wait for instructions",
            isCorrect: false,
            feedback:
              "While communication is important, you should take immediate action while waiting for instructions.",
            points: 50,
            nextStage: 1,
            consequences: "Delay in response allows the attacker more time.",
          },
        ],
        hints: [
          "Check the logs for patterns",
          "Consider the principle of least privilege",
          "Time is critical in security incidents",
        ],
        image:
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2,
        title: "Investigation",
        description:
          "After blocking the IP, you examine the logs and find that the attacker attempted to use stolen credentials. You need to determine the next steps.",
        context:
          "Log Analysis shows attempts on: admin@company.com, john.doe@company.com",
        options: [
          {
            id: "a",
            text: "Reset passwords for all affected accounts and enable 2FA",
            isCorrect: true,
            feedback:
              "Excellent! Password reset and 2FA are standard security measures after a breach attempt.",
            points: 100,
            nextStage: 3,
            consequences:
              "Accounts are secured and additional protection is in place.",
          },
          {
            id: "b",
            text: "Send an email to all employees about the breach",
            isCorrect: false,
            feedback:
              "Too early for company-wide communication. Investigate fully first.",
            points: 25,
            nextStage: 2,
            consequences: "Causes unnecessary panic among employees.",
          },
          {
            id: "c",
            text: "Delete all logs and start fresh",
            isCorrect: false,
            feedback:
              "Never delete logs! They are crucial for investigation and compliance.",
            points: 0,
            nextStage: 2,
            consequences: "Critical evidence is lost.",
          },
        ],
        hints: [
          "Think about account security",
          "Consider authentication methods",
          "Document everything",
        ],
      },
      {
        id: 3,
        title: "Containment & Eradication",
        description:
          "You've secured the accounts. Now you need to ensure the attacker didn't install any malware or backdoors.",
        options: [
          {
            id: "a",
            text: "Run full system scans and check for unauthorized changes",
            isCorrect: true,
            feedback: "Perfect! Thorough scanning ensures no malware remains.",
            points: 100,
            nextStage: 4,
            consequences: "No malware found, systems are clean.",
          },
          {
            id: "b",
            text: "Assume everything is fine and resume normal operations",
            isCorrect: false,
            feedback:
              "Risky! Always verify system integrity after a breach attempt.",
            points: 0,
            nextStage: 3,
            consequences: "Undetected malware could cause future breaches.",
          },
        ],
        hints: [
          "Check for unusual processes",
          "Verify system file integrity",
          "Review scheduled tasks",
        ],
      },
      {
        id: 4,
        title: "Recovery & Reporting",
        description: "The incident has been contained. What's your final step?",
        options: [
          {
            id: "a",
            text: "Document the incident and prepare a report for management",
            isCorrect: true,
            feedback:
              "Excellent! Documentation is crucial for compliance and future prevention.",
            points: 100,
            nextStage: -1,
            consequences: "Incident properly documented, lessons learned.",
          },
          {
            id: "b",
            text: "Go back to regular work without documentation",
            isCorrect: false,
            feedback: "Documentation is a critical part of incident response.",
            points: 0,
            nextStage: 4,
            consequences: "No record of the incident for future reference.",
          },
        ],
        hints: [
          "Documentation is key",
          "Include timeline and actions taken",
          "Note recommendations for prevention",
        ],
      },
    ],
  };

  const handleTimeOut = () => {
    setCompleted(true);
    setResults({
      completed: false,
      message: "Time's up! Your session has ended.",
      score: score,
      totalPossible: scenario.totalPoints,
      stagesCompleted: currentStage,
      feedback: "You ran out of time. Try again to complete the scenario.",
    });
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setShowFeedback(true);
    setFeedback({
      correct: option.isCorrect,
      message: option.feedback,
      points: option.points,
      consequences: option.consequences,
    });

    setScore((prev) => prev + option.points);

    // Track used hints
    if (showHint) {
      // Deduct points for using hints (optional)
      // setScore(prev => prev - 10);
    }
  };

  const handleContinue = () => {
    if (selectedOption.nextStage === -1) {
      // Scenario completed
      setCompleted(true);
      setResults({
        completed: true,
        message: "Congratulations! You've successfully completed the scenario.",
        score: score,
        totalPossible: scenario.totalPoints,
        stagesCompleted: currentStage + 1,
        feedback: "You demonstrated excellent incident response skills!",
        badges: ["Security Responder", "Quick Thinker"],
        recommendations: [
          "Consider taking advanced security courses",
          "Practice with more complex scenarios",
        ],
      });
    } else {
      setCurrentStage(selectedOption.nextStage);
      setSelectedOption(null);
      setShowFeedback(false);
      setShowHint(false);
    }
  };

  const handleRetry = () => {
    setCurrentStage(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setFeedback(null);
    setScore(0);
    setTimeRemaining(scenario.timeLimit * 60);
    setCompleted(false);
    setResults(null);
    setHints([]);
    setShowHint(false);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
    if (!showHint && scenario.stages[currentStage].hints) {
      // Show next hint
      const stageHints = scenario.stages[currentStage].hints;
      if (hints.length < stageHints.length) {
        setHints((prev) => [...prev, stageHints[prev.length]]);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setFullscreen(!fullscreen);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading scenario...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.resultsCard}>
          <div className={styles.resultsHeader}>
            {results.completed ? (
              <FiCheckCircle className={styles.successIcon} />
            ) : (
              <FiAlertCircle className={styles.timeoutIcon} />
            )}
            <h2>{results.completed ? "Scenario Complete!" : "Time's Up!"}</h2>
            <p>{results.message}</p>
          </div>

          <div className={styles.scoreBreakdown}>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Your Score</span>
              <span className={styles.scoreValue}>{results.score}</span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Total Possible</span>
              <span className={styles.scoreValue}>{results.totalPossible}</span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Percentage</span>
              <span className={styles.scoreValue}>
                {Math.round((results.score / results.totalPossible) * 100)}%
              </span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Stages Completed</span>
              <span className={styles.scoreValue}>
                {results.stagesCompleted}/{scenario.stages.length}
              </span>
            </div>
          </div>

          <div className={styles.feedbackSection}>
            <h3>Feedback</h3>
            <p>{results.feedback}</p>
          </div>

          {results.badges && (
            <div className={styles.badgesEarned}>
              <h3>Badges Earned</h3>
              <div className={styles.badges}>
                {results.badges.map((badge, index) => (
                  <span key={index} className={styles.badge}>
                    <FiAward /> {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          {results.recommendations && (
            <div className={styles.recommendations}>
              <h3>Recommendations</h3>
              <ul>
                {results.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.resultsActions}>
            <button onClick={handleRetry} className={styles.retryBtn}>
              <FiRefreshCw /> Try Again
            </button>
            <button
              onClick={() => navigate("/scenarios")}
              className={styles.browseBtn}
            >
              Browse More Scenarios
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className={styles.dashboardBtn}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStageData = scenario.stages[currentStage];

  return (
    <div className={styles.scenarioContainer}>
      {/* Header */}
      <div className={styles.scenarioHeader}>
        <div className={styles.headerLeft}>
          <button
            onClick={() => navigate("/scenarios")}
            className={styles.backBtn}
          >
            <FiChevronLeft /> Back
          </button>
          <div className={styles.scenarioInfo}>
            <h1>{scenario.title}</h1>
            <div className={styles.scenarioMeta}>
              <span className={styles.metaItem}>
                <FiBarChart2 /> {scenario.difficulty}
              </span>
              <span className={styles.metaItem}>
                <FiUsers /> {scenario.participants} completed
              </span>
              <span className={styles.metaItem}>
                <FiStar /> Avg. {scenario.avgScore}%
              </span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={`${styles.iconBtn} ${bookmarked ? styles.active : ""}`}
            onClick={() => setBookmarked(!bookmarked)}
          >
            <FiStar />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
          </button>
          <button className={styles.iconBtn} onClick={toggleFullscreen}>
            {fullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
          <button className={styles.iconBtn} onClick={() => setShowHelp(true)}>
            <FiHelpCircle />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${((currentStage + 1) / scenario.stages.length) * 100}%`,
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className={styles.scenarioMain}>
        {/* Left Column - Scenario Content */}
        <div className={styles.scenarioContent}>
          <div className={styles.stageIndicator}>
            <span className={styles.stageNumber}>
              Stage {currentStage + 1}/{scenario.stages.length}
            </span>
            <h2 className={styles.stageTitle}>{currentStageData.title}</h2>
          </div>

          {currentStageData.image && (
            <div className={styles.scenarioImage}>
              <img src={currentStageData.image} alt="Scenario context" />
            </div>
          )}

          <div className={styles.scenarioDescription}>
            <p>{currentStageData.description}</p>
          </div>

          {currentStageData.context && (
            <div className={styles.scenarioContext}>
              <h3>Context</h3>
              <pre>{currentStageData.context}</pre>
            </div>
          )}

          {/* Options */}
          {!showFeedback && (
            <div className={styles.optionsSection}>
              <h3>Choose your action:</h3>
              <div className={styles.options}>
                {currentStageData.options.map((option) => (
                  <button
                    key={option.id}
                    className={styles.optionBtn}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <span className={styles.optionLetter}>
                      {option.id.toUpperCase()}
                    </span>
                    <span className={styles.optionText}>{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {showFeedback && feedback && (
            <div
              className={`${styles.feedback} ${feedback.correct ? styles.correct : styles.incorrect}`}
            >
              <div className={styles.feedbackHeader}>
                {feedback.correct ? (
                  <FiCheckCircle className={styles.feedbackIcon} />
                ) : (
                  <FiXCircle className={styles.feedbackIcon} />
                )}
                <span className={styles.feedbackTitle}>
                  {feedback.correct ? "Correct!" : "Incorrect"}
                </span>
                <span className={styles.feedbackPoints}>
                  +{feedback.points} points
                </span>
              </div>
              <p className={styles.feedbackMessage}>{feedback.message}</p>
              <div className={styles.feedbackConsequences}>
                <strong>Consequence:</strong> {feedback.consequences}
              </div>
              <button className={styles.continueBtn} onClick={handleContinue}>
                Continue <FiChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className={styles.scenarioSidebar}>
          {/* Timer */}
          <div className={styles.timerCard}>
            <FiClock className={styles.timerIcon} />
            <div className={styles.timerInfo}>
              <span className={styles.timerLabel}>Time Remaining</span>
              <span
                className={`${styles.timerValue} ${timeRemaining < 60 ? styles.timerWarning : ""}`}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Score */}
          <div className={styles.scoreCard}>
            <FiAward className={styles.scoreIcon} />
            <div className={styles.scoreInfo}>
              <span className={styles.scoreLabel}>Current Score</span>
              <span className={styles.scoreValue}>
                {score}/{scenario.totalPoints}
              </span>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className={styles.objectivesCard}>
            <h3>Learning Objectives</h3>
            <ul className={styles.objectivesList}>
              {scenario.learningObjectives.map((obj, index) => (
                <li key={index}>
                  <FiCheckCircle className={styles.objectiveIcon} />
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          {/* Hints */}
          <div className={styles.hintsCard}>
            <div className={styles.hintsHeader}>
              <h3>Hints</h3>
              <button
                className={styles.hintBtn}
                onClick={toggleHint}
                disabled={
                  showHint && hints.length >= currentStageData.hints.length
                }
              >
                {showHint ? "Hide Hint" : "Show Hint"}
              </button>
            </div>
            {showHint && (
              <div className={styles.hintsList}>
                {hints.map((hint, index) => (
                  <div key={index} className={styles.hint}>
                    <FiHelpCircle /> {hint}
                  </div>
                ))}
                {hints.length === 0 && (
                  <div className={styles.hint}>No hints available</div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actionsCard}>
            <button
              className={styles.actionBtn}
              onClick={() => setShowHelp(true)}
            >
              <FiMessageCircle /> Get Help
            </button>
            <button className={styles.actionBtn}>
              <FiSave /> Save Progress
            </button>
            <button className={styles.actionBtn}>
              <FiShare2 /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className={styles.modalOverlay} onClick={() => setShowHelp(false)}>
          <div
            className={styles.helpModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>How to Play</h2>
            <div className={styles.helpContent}>
              <div className={styles.helpSection}>
                <h3>Scenario Structure</h3>
                <p>
                  Each scenario consists of multiple stages. Your choices
                  determine the outcome and your score.
                </p>
              </div>
              <div className={styles.helpSection}>
                <h3>Scoring</h3>
                <ul>
                  <li>Correct answers earn full points</li>
                  <li>Partial points for partially correct answers</li>
                  <li>No points for incorrect answers</li>
                  <li>Using hints may reduce points</li>
                </ul>
              </div>
              <div className={styles.helpSection}>
                <h3>Tips</h3>
                <ul>
                  <li>Read each stage carefully</li>
                  <li>Consider the consequences of your actions</li>
                  <li>Use hints if you're stuck</li>
                  <li>Time management is important</li>
                </ul>
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setShowHelp(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
