import { Alert, Card, Empty, Select, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { getDoctorSchedules, getDoctors } from "../../services/admin.js";

const { Title, Paragraph } = Typography;
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SchedulesPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoadingDoctors(true);
      setError("");

      try {
        const result = await getDoctors({ page: 1, limit: 100 });
        setDoctors(result.items);
        if (result.items[0]) {
          setSelectedDoctorId(result.items[0].id || result.items[0]._id);
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) {
      return;
    }

    const loadSchedules = async () => {
      setIsLoadingSchedules(true);
      setError("");

      try {
        const result = await getDoctorSchedules(selectedDoctorId, {
          includeInactive: true,
        });
        setSchedules(result.items);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    loadSchedules();
  }, [selectedDoctorId]);

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title level={3} className="!mb-2">
            Schedules
          </Title>
        </div>
        <Select
          placeholder="Select doctor"
          className="w-full lg:max-w-md"
          loading={isLoadingDoctors}
          value={selectedDoctorId}
          onChange={setSelectedDoctorId}
          options={doctors.map((doctor) => ({
            value: doctor.id || doctor._id,
            label: `${doctor.user?.name} - ${doctor.specialization}`,
          }))}
        />
      </div>

      {error ? (
        <Alert type="error" message={error} showIcon className="mb-4" />
      ) : null}

      {selectedDoctorId ? (
        <Table
          rowKey={(record) => record.id || record._id}
          loading={isLoadingSchedules}
          dataSource={schedules}
          locale={{
            emptyText: (
              <Empty description="No schedules found for the selected doctor" />
            ),
          }}
          pagination={{ pageSize: 6 }}
          columns={[
            {
              title: "Effective From",
              dataIndex: "effectiveFrom",
              key: "effectiveFrom",
            },
            {
              title: "Effective To",
              dataIndex: "effectiveTo",
              key: "effectiveTo",
              render: (value) => value || "Open-ended",
            },
            { title: "Timezone", dataIndex: "timezone", key: "timezone" },
            {
              title: "Slot Duration",
              dataIndex: "slotDurationMinutes",
              key: "slotDurationMinutes",
              render: (value) => `${value} min`,
            },
            {
              title: "Working Days",
              key: "workingDays",
              render: (_, record) =>
                record.workingDays
                  .filter((day) => day.isWorking)
                  .map((day) => dayLabels[day.dayOfWeek])
                  .join(", "),
            },
            {
              title: "Status",
              key: "status",
              render: (_, record) => (
                <Tag color={record.isActive ? "green" : "default"}>
                  {record.isActive ? "Active" : "Inactive"}
                </Tag>
              ),
            },
          ]}
        />
      ) : (
        <Empty description="Select a doctor to inspect schedules" />
      )}
    </Card>
  );
}

export default SchedulesPage;
