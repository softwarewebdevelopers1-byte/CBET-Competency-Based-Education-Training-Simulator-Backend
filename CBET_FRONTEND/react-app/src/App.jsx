import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoginRoute } from "./AuthRoutes/login.jsx";
import AdminLayout from "./admin/components/AdminLayout.jsx";
import { SignUpRoute } from "./AuthRoutes/signUp.jsx";
import { LandingPage } from "./others/landingPage.jsx";
import { Dashboard } from "./Dashboard/dashboard.jsx";
import { ErrorPage } from "./others/error.jsx";
import { Homepage } from "./Dashboard/homePage.jsx";
import { MyCourses } from "./Dashboard/courses.jsx";
import { CourseDetail } from "./Dashboard/CourseDetail.jsx";
import { AchievementsPage } from "./Dashboard/archievement.jsx";
import { MyPortfolio } from "./Dashboard/myPortifolio.jsx";
import { InteractiveScenario } from "./Dashboard/interactivepage.jsx";
import { AuthRoutes } from "./AuthRoutes/combine.auth.jsx";
import AdminDashboard from "./admin/pages/Dashboard.jsx";
import UserManagement from "./admin/pages/UserManagement.jsx";
import AssessmentManagement from "./admin/pages/AssessmentManagement.jsx";
import UnitManagement from "./admin/pages/UnitManagement.jsx";
import TrainerLayout from "./trainer/components/TrainerLayout.jsx";
import TrainerDashboard from "./trainer/pages/Dashboard.jsx";
import AssessmentBuilder from "./trainer/pages/AssessmentBuilder.jsx";
import AssignedUnits from "./trainer/pages/AssignedUnits.jsx";
import MaterialManagement from "./admin/pages/MaterialManagement.jsx";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <Dashboard>
              <Homepage />
            </Dashboard>
          }
        />
        <Route
          path="/courses"
          element={
            <Dashboard>
              <MyCourses />
            </Dashboard>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <Dashboard>
              <CourseDetail />
            </Dashboard>
          }
        />
        <Route
          path="/portfolio"
          element={
            <Dashboard>
              <MyPortfolio />
            </Dashboard>
          }
        />
        <Route
          path="/achievements"
          element={
            <Dashboard>
              <AchievementsPage />
            </Dashboard>
          }
        />
        <Route
          path="/assessments"
          element={
            <Dashboard>
              <InteractiveScenario
                activityType="assessment"
                heading="AI Assessments"
                emptyHeading="No assessments assigned yet"
                emptyCopy="Your trainer has not uploaded an assessment PDF for your course yet."
              />
            </Dashboard>
          }
        />
        <Route
          path="/scenarios"
          element={
            <Dashboard>
              <InteractiveScenario
                activityType="assessment"
                heading="AI Assessments"
                emptyHeading="No assessments assigned yet"
                emptyCopy="Your trainer has not uploaded an assessment PDF for your course yet."
              />
            </Dashboard>
          }
        />
        {/* admin dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminLayout>
              <UserManagement />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/simulations"
          element={
            <AdminLayout>
              <AssessmentManagement />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/assessments"
          element={
            <AdminLayout>
              <AssessmentManagement />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/unit-assignments"
          element={
            <AdminLayout>
              <UnitManagement defaultTab="assignments" />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/materials"
          element={
            <AdminLayout>
              <MaterialManagement />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/program-units"
          element={
            <AdminLayout>
              <UnitManagement defaultTab="bulk-add" />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/program-unit"
          element={
            <AdminLayout>
              <UnitManagement defaultTab="single-add" />
            </AdminLayout>
          }
        />
        <Route
          path="/trainer/dashboard"
          element={
            <TrainerLayout>
              <TrainerDashboard />
            </TrainerLayout>
          }
        />
        <Route
          path="/trainer/units"
          element={
            <TrainerLayout>
              <AssignedUnits />
            </TrainerLayout>
          }
        />
        <Route
          path="/trainer/assessments"
          element={
            <TrainerLayout>
              <AssessmentBuilder />
            </TrainerLayout>
          }
        />
        <Route
          path="/trainer/scenarios"
          element={
            <TrainerLayout>
              <AssessmentBuilder />
            </TrainerLayout>
          }
        />
        <Route
          path="/login"
          element={
            <AuthRoutes>
              <LoginRoute />
            </AuthRoutes>
          }
        />
        <Route path="*" element={<ErrorPage type="404" />} />
        <Route
          path="/signup"
          element={
            <AuthRoutes>
              <SignUpRoute />
            </AuthRoutes>
          }
        />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
