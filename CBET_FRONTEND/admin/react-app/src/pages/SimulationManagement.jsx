// pages/SimulationManagement.jsx
import React, { useState } from "react";
import { Plus, Play, Edit2, Copy, Trash2, Eye, Filter } from "lucide-react";

const SimulationManagement = () => {
  const [simulations] = useState([
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

  return (
    <div className="simulation-management">
      <div className="page-header">
        <h1>Simulation Management</h1>
        <div className="header-actions">
          <button className="secondary-btn">
            <Filter size={20} />
            Filter
          </button>
          <button className="primary-btn">
            <Plus size={20} />
            Create Simulation
          </button>
        </div>
      </div>

      <div className="simulations-grid">
        {simulations.map((sim) => (
          <div key={sim.id} className="simulation-card">
            <div className="card-header">
              <span className={`sim-type ${sim.type.toLowerCase()}`}>
                {sim.type}
              </span>
              <span className={`sim-status ${sim.status.toLowerCase()}`}>
                {sim.status}
              </span>
            </div>

            <h3>{sim.title}</h3>

            <div className="sim-stats">
              <div className="stat">
                <span className="stat-label">Participants</span>
                <span className="stat-value">{sim.participants}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Completion</span>
                <span className="stat-value">{sim.completion}</span>
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: sim.completion }}
              ></div>
            </div>

            <div className="card-footer">
              <span className="last-updated">Updated {sim.lastUpdated}</span>
              <div className="card-actions">
                <button className="icon-btn" title="Preview">
                  <Eye size={16} />
                </button>
                <button className="icon-btn" title="Edit">
                  <Edit2 size={16} />
                </button>
                <button className="icon-btn" title="Duplicate">
                  <Copy size={16} />
                </button>
                <button className="icon-btn" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulationManagement;
