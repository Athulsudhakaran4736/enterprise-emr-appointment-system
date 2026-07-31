import { App as AntApp, ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LoginPage from './components/LoginPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ROLES } from './constants/auth.js'
import AdminLayout from './layouts/AdminLayout.jsx'
import DepartmentsPage from './pages/admin/DepartmentsPage.jsx'
import DoctorsPage from './pages/admin/DoctorsPage.jsx'
import AppointmentsPage from './pages/admin/AppointmentsPage.jsx'
import PatientsPage from './pages/admin/PatientsPage.jsx'
import ReceptionistsPage from './pages/admin/ReceptionistsPage.jsx'
import SchedulesPage from './pages/admin/SchedulesPage.jsx'
import SuperAdminDashboardPage from './pages/admin/SuperAdminDashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import UnauthorizedPage from './pages/UnauthorizedPage.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import PublicRoute from './routes/PublicRoute.jsx'

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0f766e',
          borderRadius: 16,
          fontFamily:
            '"Segoe UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<SuperAdminDashboardPage />} />
                  <Route path="departments" element={<DepartmentsPage />} />
                  <Route path="doctors" element={<DoctorsPage />} />
                  <Route path="schedules" element={<SchedulesPage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="patients" element={<PatientsPage />} />
                  <Route path="receptionists" element={<ReceptionistsPage />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
