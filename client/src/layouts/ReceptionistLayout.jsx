import { Link } from 'react-router-dom'
import ConsoleLayout from './ConsoleLayout.jsx'

const navigationItems = [
  {
    key: '/receptionist/dashboard',
    label: <Link to="/receptionist/dashboard">Dashboard</Link>,
  },
  {
    key: '/receptionist/appointments',
    label: <Link to="/receptionist/appointments">Appointments</Link>,
  },
  {
    key: '/receptionist/patients',
    label: <Link to="/receptionist/patients">Patients</Link>,
  },
  {
    key: '/receptionist/doctors',
    label: <Link to="/receptionist/doctors">Doctors</Link>,
  },
  {
    key: '/receptionist/schedules',
    label: <Link to="/receptionist/schedules">Schedules</Link>,
  },
]

function ReceptionistLayout() {
  return (
    <ConsoleLayout
      title="Reception Desk"
      subtitle="Appointment operations, patient registration, and doctor availability in one workspace."
      roleLabel="RECEPTIONIST"
      brandLabel="Enterprise EMR"
      navigationItems={navigationItems}
    />
  )
}

export default ReceptionistLayout
