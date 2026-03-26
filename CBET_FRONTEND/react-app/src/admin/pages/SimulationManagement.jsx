// pages/SimulationManagement.jsx
import React, { useState } from "react";
import {
  Plus,
  Play,
  Edit2,
  Copy,
  Trash2,
  Eye,
  Filter,
  Gamepad2,
} from "lucide-react";
import styles from "../styles/simulationManagement.module.css";

const SimulationManagement = () => {
  const [simulations, setSimulations] = useState([
    {
      id: 1,
      title: "Electrical Installation Safety",
      type: "Technical",
      participants: 45,
      completion: "78%",
      status: "Active",
      lastUpdated: "2 days ago",
    },
    {
      id: 2,
      title: "Workplace Ethics Scenario",
      type: "Ethical",
      participants: 32,
      completion: "92%",
      status: "Active",
      lastUpdated: "1 day ago",
    },
    {
      id: 3,
      title: "Plumbing System Design",
      type: "Technical",
      participants: 28,
      completion: "45%",
      status: "Draft",
      lastUpdated: "5 days ago",
    },
    {
      id: 4,
      title: "Customer Service Excellence",
      type: "Soft Skills",
      participants: 56,
      completion: "63%",
      status: "Active",
      lastUpdated: "3 hours ago",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const handleCreateSimulation = () => {
    console.log("Create new simulation");
    // Implement create simulation modal/logic
  };

  const handleEditSimulation = (id) => {
    console.log("Edit simulation:", id);
    // Implement edit logic
  };

  const handleDuplicateSimulation = (id) => {
    console.log("Duplicate simulation:", id);
    const simulationToDuplicate = simulations.find((sim) => sim.id === id);
    if (simulationToDuplicate) {
      const newSimulation = {
        ...simulationToDuplicate,
        id: Date.now(),
        title: `${simulationToDuplicate.title} (Copy)`,
        status: "Draft",
        lastUpdated: "Just now",
      };
      setSimulations([...simulations, newSimulation]);
    }
  };

  const handleDeleteSimulation = (id) => {
    if (window.confirm("Are you sure you want to delete this simulation?")) {
      setSimulations(simulations.filter((sim) => sim.id !== id));
    }
  };

  const handlePreviewSimulation = (id) => {
    console.log("Preview simulation:", id);
    // Implement preview logic
  };

  const handleFilter = () => {
    console.log("Open filter options");
    // Implement filter modal
  };

  const filteredSimulations =
    filterType === "all"
      ? simulations
      : simulations.filter((sim) => sim.type.toLowerCase() === filterType);

  return (
    <div className={styles.simulationManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Simulation Management</h1>
          <p className={styles.pageDescription}>
            Track, update, and launch practical training simulations.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={handleFilter}>
            <Filter size={20} />
            Filter
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleCreateSimulation}
          >
            <Plus size={20} />
            Create Simulation
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading simulations...</p>
        </div>
      ) : filteredSimulations.length === 0 ? (
        <div className={styles.emptyState}>
          <Gamepad2 size={80} />
          <h3>No simulations found</h3>
          <p>Create your first simulation to get started</p>
          <button
            className={styles.primaryBtn}
            onClick={handleCreateSimulation}
          >
            <Plus size={20} />
            Create Simulation
          </button>
        </div>
      ) : (
        <div className={styles.simulationsGrid}>
          {filteredSimulations.map((sim) => (
            <div key={sim.id} className={styles.simulationCard}>
              <div className={styles.cardHeader}>
                <span
                  className={`${styles.simType} ${styles[sim.type.toLowerCase().replace(" ", "")]}`}
                >
                  {sim.type}
                </span>
                <span
                  className={`${styles.simStatus} ${styles[sim.status.toLowerCase()]}`}
                >
                  {sim.status}
                </span>
              </div>

              <h3>{sim.title}</h3>

              <div className={styles.simStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Participants</span>
                  <span className={styles.statValue}>{sim.participants}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Completion</span>
                  <span className={styles.statValue}>{sim.completion}</span>
                </div>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: sim.completion }}
                ></div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.lastUpdated}>
                  Updated {sim.lastUpdated}
                </span>
                <div className={styles.cardActions}>
                  <button
                    className={styles.iconBtn}
                    title="Preview"
                    onClick={() => handlePreviewSimulation(sim.id)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    title="Edit"
                    onClick={() => handleEditSimulation(sim.id)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    title="Duplicate"
                    onClick={() => handleDuplicateSimulation(sim.id)}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    title="Delete"
                    onClick={() => handleDeleteSimulation(sim.id)}
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

export default SimulationManagement;
