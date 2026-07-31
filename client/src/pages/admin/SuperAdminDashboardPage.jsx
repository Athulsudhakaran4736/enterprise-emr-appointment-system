import { Card, Col, Row, Statistic, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  getAppointments,
  getDepartments,
  getDoctors,
  getPatients,
  getUsers,
} from "../../services/admin.js";

const { Title, Paragraph } = Typography;

function SuperAdminDashboardPage() {
  const [stats, setStats] = useState({
    departments: 0,
    doctors: 0,
    appointments: 0,
    patients: 0,
    receptionists: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const [departments, doctors, appointments, patients, receptionists] =
        await Promise.all([
          getDepartments({ includeInactive: true }),
          getDoctors({ page: 1, limit: 1 }),
          getAppointments({ page: 1, limit: 1 }),
          getPatients({ page: 1, limit: 1, includeInactive: true }),
          getUsers({ role: "RECEPTIONIST", page: 1, limit: 1 }),
        ]);

      setStats({
        departments: departments.meta.total ?? departments.items.length,
        doctors: doctors.meta.pagination?.totalItems ?? doctors.items.length,
        appointments:
          appointments.meta.pagination?.totalItems ?? appointments.items.length,
        patients: patients.meta.pagination?.totalItems ?? patients.items.length,
        receptionists:
          receptionists.meta.pagination?.totalItems ??
          receptionists.items.length,
      });
    };

    loadStats().catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card>
            <Statistic title="Departments" value={stats.departments} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card>
            <Statistic title="Doctors" value={stats.doctors} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card>
            <Statistic title="Appointments" value={stats.appointments} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card>
            <Statistic title="Patients" value={stats.patients} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card>
            <Statistic title="Receptionists" value={stats.receptionists} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SuperAdminDashboardPage;
