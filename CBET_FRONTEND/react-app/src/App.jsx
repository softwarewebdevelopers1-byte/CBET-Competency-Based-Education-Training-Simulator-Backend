import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginRoute } from "./AuthRoutes/login.jsx";
import AdminLayout from "./admin/components/AdminLayout.jsx";
import { SignUpRoute } from "./AuthRoutes/signUp.jsx";
import { LandingPage } from "./others/landingPage.jsx";
import { Dashboard } from "./Dashboard/dashboard.jsx";
import { ErrorPage } from "./others/error.jsx";
import { Homepage } from "./Dashboard/homePage.jsx";
import { MyCourses } from "./Dashboard/courses.jsx";
import { AchievementsPage } from "./Dashboard/archievement.jsx";
import { MyPortfolio } from "./Dashboard/myPortifolio.jsx";
import { InteractiveScenario } from "./Dashboard/interactivepage.jsx";
import { AssessmentsPage } from "./Dashboard/assesment.jsx";
import { AuthRoutes } from "./AuthRoutes/combine.auth.jsx";
import AdminDashboard from "./admin/pages/Dashboard.jsx";
import UserManagement from "./admin/pages/UserManagement.jsx";
import SimulationManagement from "./admin/pages/SimulationManagement.jsx";

function App() {
  return (
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
              <AssessmentsPage />
            </Dashboard>
          }
        />
        <Route
          path="/scenarios"
          element={
            <Dashboard>
              <InteractiveScenario />
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
              <SimulationManagement />
            </AdminLayout>
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
  );
}

export default App;
