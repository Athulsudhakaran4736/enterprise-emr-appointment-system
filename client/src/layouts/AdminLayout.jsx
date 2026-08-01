import { Link } from 'react-router-dom'
import ConsoleLayout from './ConsoleLayout.jsx'

const navigationItems = [
  {
    key: '/admin/dashboard',
    label: <Link to="/admin/dashboard">Dashboard</Link>,
  },
  {
    key: '/admin/departments',
    label: <Link to="/admin/departments">Departments</Link>,
  },
  {
    key: '/admin/doctors',
    label: <Link to="/admin/doctors">Doctors</Link>,
  },
  {
    key: '/admin/schedules',
    label: <Link to="/admin/schedules">Schedules</Link>,
  },
  {
    key: '/admin/appointments',
    label: <Link to="/admin/appointments">Appointments</Link>,
  },
  {
    key: '/admin/patients',
    label: <Link to="/admin/patients">Patients</Link>,
  },
  {
    key: '/admin/receptionists',
    label: <Link to="/admin/receptionists">Receptionists</Link>,
  },
]

function AdminLayout() {
  return (
    <ConsoleLayout
      title="EMR Admin Console"
      subtitle="Protected access for enterprise appointment management."
      roleLabel="SUPER_ADMIN"
      brandLabel="Enterprise EMR"
      navigationItems={navigationItems}
    />
  )
}

export default AdminLayout
