import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CameraDashboardPage from "./pages/CameraDashboardPage";
import SensorsPage from "./pages/SensorsPage";
import IncidentsPage from "./pages/IncidentsPage";
import AlertsPage from "./pages/AlertsPage";
import MapPage from "./pages/MapPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import MaintenancePage from "./pages/MaintenancePage";

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cameras"
                element={
                  <ProtectedRoute>
                    <CameraDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sensors"
                element={
                  <ProtectedRoute>
                    <SensorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/incidents"
                element={
                  <ProtectedRoute>
                    <IncidentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <AlertsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maintenance"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <MaintenancePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
