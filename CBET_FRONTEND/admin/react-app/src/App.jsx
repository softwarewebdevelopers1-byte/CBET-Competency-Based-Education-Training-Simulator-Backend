// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import SimulationManagement from "./pages/SimulationManagement";
import LearningMaterials from "./pages/LearningMaterials";
import AssessmentGenerator from "./pages/AssessmentGenerator";
import PortfolioReview from "./pages/PortfolioReview";
import GamificationSettings from "./pages/GamificationSettings";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import SystemSettings from "./pages/SystemSettings";
import "./styles/admin.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="simulations" element={<SimulationManagement />} />
          <Route path="materials" element={<LearningMaterials />} />
          <Route path="assessments" element={<AssessmentGenerator />} />
          <Route path="portfolio" element={<PortfolioReview />} />
          <Route path="gamification" element={<GamificationSettings />} />
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
