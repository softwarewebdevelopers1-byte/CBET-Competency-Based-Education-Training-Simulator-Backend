import React from "react";
import SimulationManagement from "../../admin/pages/SimulationManagement.jsx";

const AssessmentBuilder = () => {
  return (
    <SimulationManagement
      activityType="assessment"
      ownership="self"
      pageTitle="Create Assessments"
      pageDescription="Build and manage the assessments you assign to trainees."
    />
  );
};

export default AssessmentBuilder;
