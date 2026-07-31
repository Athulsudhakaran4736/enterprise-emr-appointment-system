import { Alert, Card, List, Spin, Statistic, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import {
  getMyAppointments,
  getMyDoctorSchedules,
  getMyDoctorProfile,
} from "../../services/doctor.js";
import {
  appointmentStatusColors,
  formatStatusLabel,
  formatTimeRange,
} from "./doctor-utils.js";

const { Title, Paragraph, Text } = Typography;

function DoctorDashboardPage() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [profile, appointmentResult, scheduleResult] = await Promise.all([
          getMyDoctorProfile(user),
          getMyAppointments({ page: 1, limit: 50 }),
          getMyDoctorSchedules(user),
        ]);

        setDoctor(profile);
        setAppointments(appointmentResult.items);
        setSchedules(scheduleResult.items);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const today = dayjs().format("YYYY-MM-DD");

  const metrics = useMemo(() => {
    const todaysAppointments = appointments.filter(
      (item) => item.appointmentDate === today,
    );

    return {
      scheduled: todaysAppointments.filter(
        (item) => item.status === "SCHEDULED",
      ).length,
      arrived: todaysAppointments.filter((item) => item.status === "ARRIVED")
        .length,
      completed: todaysAppointments.filter(
        (item) => item.status === "COMPLETED",
      ).length,
      totalToday: todaysAppointments.length,
    };
  }, [appointments, today]);

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter((item) => item.appointmentDate >= today).slice(0, 5),
    [appointments, today],
  );

  const activeSchedule = schedules.find((item) => item.isActive);

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

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
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
                  <Link
                    key="view"
                    to={`/doctor/appointments/${item.id || item._id}`}
                  >
                    View
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={item.patient?.name || "Unknown patient"}
                  description={`${item.appointmentDate} � ${formatTimeRange(item.startTime, item.endTime)} � ${item.department?.name || "Department unavailable"}`}
                />
                <Tag color={appointmentStatusColors[item.status] || "default"}>
                  {formatStatusLabel(item.status)}
                </Tag>
              </List.Item>
            )}
          />
        </Card>

        <Card
          className="rounded-[28px] border-0 shadow-sm"
          title="Profile snapshot"
        >
          <div className="space-y-4">
            <div>
              <Text className="!text-slate-500">Registration number</Text>
              <div className="font-semibold text-slate-900">
                {doctor?.registrationNumber || "Unavailable"}
              </div>
            </div>
            <div>
              <Text className="!text-slate-500">Qualification</Text>
              <div className="font-semibold text-slate-900">
                {doctor?.qualification || "Unavailable"}
              </div>
            </div>
            <div>
              <Text className="!text-slate-500">Consultation duration</Text>
              <div className="font-semibold text-slate-900">
                {doctor?.consultationDuration || "Unavailable"} minutes
              </div>
            </div>
            <div>
              <Text className="!text-slate-500">Account email</Text>
              <div className="font-semibold text-slate-900">
                {doctor?.user?.email || user?.email}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DoctorDashboardPage;
