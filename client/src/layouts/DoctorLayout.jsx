import { Link } from "react-router-dom";
import ConsoleLayout from "./ConsoleLayout.jsx";

const navigationItems = [
  {
    key: "/doctor/dashboard",
    label: <Link to="/doctor/dashboard">Dashboard</Link>,
  },
  {
    key: "/doctor/appointments",
    label: <Link to="/doctor/appointments">My Appointments</Link>,
  },
  {
    key: "/doctor/schedule",
    label: <Link to="/doctor/schedule">My Schedule</Link>,
  },
  {
    key: "/doctor/profile",
    label: <Link to="/doctor/profile">My Profile</Link>,
  },
];

function DoctorLayout() {
  return (
    <ConsoleLayout
      title="Doctor Workspace"
      roleLabel="DOCTOR"
      brandLabel="Enterprise EMR"
      navigationItems={navigationItems}
    />
  );
}

export default DoctorLayout;
