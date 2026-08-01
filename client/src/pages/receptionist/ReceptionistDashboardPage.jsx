import { Alert, Card, List, Spin, Statistic, Tag } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAppointments,
  getDoctors,
  getPatients,
} from "../../services/admin.js";
import { subscribeToAppointmentChanges } from "../../services/realtime.js";
import {
  appointmentStatusColors,
  formatStatusLabel,
} from "./receptionist-utils.js";

function ReceptionistDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [patientCount, setPatientCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [appointmentResult, patientResult, doctorResult] =
        await Promise.all([
          getAppointments({ page: 1, limit: 100 }),
          getPatients({ page: 1, limit: 1 }),
          getDoctors({ page: 1, limit: 1 }),
        ]);

      setAppointments(appointmentResult.items);
      setPatientCount(
        patientResult.meta.pagination?.totalItems ?? patientResult.items.length,
      );
      setDoctorCount(
        doctorResult.meta.pagination?.totalItems ?? doctorResult.items.length,
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = subscribeToAppointmentChanges(() => {
      loadData();
    });

    return unsubscribe;
  }, [loadData]);

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
          <Statistic title="Registered patients" value={patientCount} />
        </Card>
        <Card className="rounded-[24px] border-0 shadow-sm">
          <Statistic title="Active doctors" value={doctorCount} />
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
                description={`${item.appointmentDate} | ${item.startTime} - ${item.endTime} | ${item.doctor?.user?.name || "Doctor unavailable"}`}
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
