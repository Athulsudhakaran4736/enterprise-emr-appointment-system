import {
  Alert,
  Card,
  Empty,
  List,
  Pagination,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { getDoctorSchedules, getDoctors } from "../../services/admin.js";
import { weekdayLabels } from "./receptionist-utils.js";

const { Title, Paragraph, Text } = Typography;
const defaultPageSize = 5;

function ReceptionistSchedulesPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(undefined);
  const [schedules, setSchedules] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: defaultPageSize,
    total: 0,
  });
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
        const firstDoctorId = result.items[0]?.id || result.items[0]?._id;
        setSelectedDoctorId(firstDoctorId);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      if (!selectedDoctorId) {
        setSchedules([]);
        return;
      }

      setIsLoadingSchedules(true);
      setError("");

      try {
        const result = await getDoctorSchedules(selectedDoctorId, {
          page: pagination.current,
          limit: pagination.pageSize,
        });
        setSchedules(result.items);
        setPagination((currentPagination) => ({
          ...currentPagination,
          total: result.meta.pagination?.totalItems ?? result.items.length,
        }));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    loadSchedules();
  }, [selectedDoctorId, pagination.current, pagination.pageSize]);

  const doctorOptions = useMemo(
    () =>
      doctors.map((doctor) => ({
        value: doctor.id || doctor._id,
        label: `${doctor.user?.name} - ${doctor.specialization}`,
      })),
    [doctors],
  );

  if (isLoadingDoctors) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-0 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Title level={3} className="!mb-2">
              Doctor Schedules
            </Title>
          </div>
          <Select
            className="w-full lg:max-w-md"
            placeholder="Select doctor"
            value={selectedDoctorId}
            onChange={(value) => {
              setSelectedDoctorId(value);
              setPagination((currentPagination) => ({
                ...currentPagination,
                current: 1,
              }));
            }}
            options={doctorOptions}
            showSearch
            optionFilterProp="label"
          />
        </div>

        {error ? (
          <Alert type="error" message={error} showIcon className="mb-4" />
        ) : null}

        {isLoadingSchedules ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : !schedules.length ? (
          <Empty description="No schedules available for the selected doctor." />
        ) : (
          <>
            <div className="grid gap-6">
              {schedules.map((schedule) => (
                <Card
                  key={schedule.id || schedule._id}
                  className="rounded-[24px] border border-slate-200 shadow-none"
                  title={
                    <div className="flex flex-wrap items-center gap-3">
                      <span>
                        {schedule.effectiveFrom} to{" "}
                        {schedule.effectiveTo || "Open ended"}
                      </span>
                      <Tag color={schedule.isActive ? "green" : "default"}>
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Tag>
                    </div>
                  }
                >
                  <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <Text className="!text-slate-500">Timezone</Text>
                      <div className="font-semibold text-slate-900">
                        {schedule.timezone}
                      </div>
                    </div>
                    <div>
                      <Text className="!text-slate-500">Slot duration</Text>
                      <div className="font-semibold text-slate-900">
                        {schedule.slotDurationMinutes} minutes
                      </div>
                    </div>
                    <div>
                      <Text className="!text-slate-500">Working days</Text>
                      <div className="font-semibold text-slate-900">
                        {
                          schedule.workingDays.filter((day) => day.isWorking)
                            .length
                        }
                      </div>
                    </div>
                  </div>

                  <List
                    dataSource={weekdayLabels.map((label, index) => ({
                      label,
                      entry: schedule.workingDays.find(
                        (day) => day.dayOfWeek === index,
                      ),
                    }))}
                    renderItem={({ label, entry }) => (
                      <List.Item>
                        <List.Item.Meta
                          title={label}
                          description={
                            entry?.isWorking
                              ? entry.sessions.length
                                ? entry.sessions
                                    .map((session) => {
                                      const breaks = session.breaks?.length
                                        ? ` | Breaks: ${session.breaks
                                            .map(
                                              (currentBreak) =>
                                                `${currentBreak.startTime}-${currentBreak.endTime}`,
                                            )
                                            .join(", ")}`
                                        : "";

                                      return `${session.startTime}-${session.endTime}${breaks}`;
                                    })
                                    .join(" � ")
                                : "Working day with no session blocks configured"
                              : "Not working"
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                pageSizeOptions={["6", "12", "24"]}
                onChange={(page, pageSize) =>
                  setPagination({
                    current: page,
                    pageSize,
                    total: pagination.total,
                  })
                }
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default ReceptionistSchedulesPage;
