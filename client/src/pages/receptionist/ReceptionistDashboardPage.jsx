import { Alert, Card, List, Spin, Statistic, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAppointments,
  getDoctors,
  getPatients,
} from "../../services/admin.js";
import {
  appointmentStatusColors,
  formatStatusLabel,
} from "./receptionist-utils.js";

const { Title, Paragraph } = Typography;

function ReceptionistDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [appointmentResult, patientResult, doctorResult] =
          await Promise.all([
            getAppointments({ page: 1, limit: 100 }),
            getPatients({ page: 1, limit: 100 }),
            getDoctors({ page: 1, limit: 100 }),
          ]);

        setAppointments(appointmentResult.items);
        setPatients(patientResult.items);
        setDoctors(doctorResult.items);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const today = dayjs().format("YYYY-MM-DD");

  const metrics = useMemo(() => {
    const todaysAppointments = appointments.filter(
      (item) => item.appointmentDate === today,
    );

    return {
      totalToday: todaysAppointments.length,
      arrived: todaysAppointments.filter((item) => item.status === "ARRIVED")
        .length,
      completed: todaysAppointments.filter(
        (item) => item.status === "COMPLETED",
      ).length,
      scheduled: todaysAppointments.filter(
        (item) => item.status === "SCHEDULED",
      ).length,
    };
  }, [appointments, today]);

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter((item) => item.appointmentDate >= today).slice(0, 5),
    [appointments, today],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? <Alert type="error" message={error} showIcon /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[24px] border-0 shadow-sm">
          <Statistic title="Today's appointments" value={metrics.totalToday} />
        </Card>
        <Card className="rounded-[24px] border-0 shadow-sm">
          <Statistic
            title="Scheduled"
            value={metrics.scheduled}
            valueStyle={{ color: "#2563eb" }}
          />
        </Card>
        <Card className="rounded-[24px] border-0 shadow-sm">
          <Statistic
            title="Arrived"
            value={metrics.arrived}
            valueStyle={{ color: "#ca8a04" }}
          />
        </Card>
        <Card className="rounded-[24px] border-0 shadow-sm">
          <Statistic
            title="Completed"
            value={metrics.completed}
            valueStyle={{ color: "#15803d" }}
          />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-[24px] border-0 shadow-sm">
          <Statistic title="Registered patients" value={patients.length} />
        </Card>
        <Card className="rounded-[24px] border-0 shadow-sm">
          <Statistic
            title="Active doctors"
            value={
              doctors.filter(
                (doctor) => doctor.isActive && doctor.user?.isActive,
              ).length
            }
          />
        </Card>
        <Card className="rounded-[24px] border-0 shadow-sm">
          <Statistic
            title="Upcoming appointments"
            value={upcomingAppointments.length}
          />
        </Card>
      </div>

      <Card
        className="rounded-[28px] border-0 shadow-sm"
        title="Upcoming appointments"
      >
        <List
          dataSource={upcomingAppointments}
          locale={{ emptyText: "No upcoming appointments found." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Link key="open" to="/receptionist/appointments">
                  Open
                </Link>,
              ]}
            >
              <List.Item.Meta
                title={item.patient?.name || "Unknown patient"}
                description={`${item.appointmentDate} � ${item.startTime} - ${item.endTime} � ${item.doctor?.user?.name || "Doctor unavailable"}`}
              />
              <Tag color={appointmentStatusColors[item.status] || "default"}>
                {formatStatusLabel(item.status)}
              </Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default ReceptionistDashboardPage;
