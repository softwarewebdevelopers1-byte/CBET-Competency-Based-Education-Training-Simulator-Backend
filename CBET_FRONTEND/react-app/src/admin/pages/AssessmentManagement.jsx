import React from "react";
import SimulationManagement from "./SimulationManagement.jsx";

const AssessmentManagement = () => {
  return (
    <SimulationManagement
      activityType="assessment"
      ownership="all"
      pageTitle="Assessment Management"
      pageDescription="Create, review, activate, and archive AI assessments across all programmes."
    />
  );
};

export default AssessmentManagement;
