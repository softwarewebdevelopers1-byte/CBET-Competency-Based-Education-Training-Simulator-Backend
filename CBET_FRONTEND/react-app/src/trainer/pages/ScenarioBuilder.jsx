import React from "react";
import SimulationManagement from "../../admin/pages/SimulationManagement.jsx";

const ScenarioBuilder = () => {
  return (
    <SimulationManagement
      activityType="scenario"
      ownership="self"
      pageTitle="Create Interactive Scenarios"
      pageDescription="Build safe-practice interactive scenarios that your students can open from the learner dashboard."
    />
  );
};

export default ScenarioBuilder;
