import {
  Alert,
  Card,
  Empty,
  List,
  Pagination,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth.js";
import { getMyDoctorSchedules } from "../../services/doctor.js";
import {
  formatSessionSummary,
  getScheduleSummary,
  weekdayLabels,
} from "./doctor-utils.js";

const { Text } = Typography;
const defaultPageSize = 5;

function DoctorSchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: defaultPageSize,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSchedules = async () => {
      setIsLoading(true);
      setError("");

      try {
        const result = await getMyDoctorSchedules(user, {
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
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, [user, pagination.current, pagination.pageSize]);

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
      {!schedules.length ? (
        <Card className="rounded-[28px] border-0 shadow-sm">
          <Empty description="No schedule has been assigned yet." />
        </Card>
      ) : (
        <>
          <div className="grid gap-6">
            {schedules.map((schedule) => {
              const workingDays = getScheduleSummary(schedule.workingDays);

              return (
                <Card
                  key={schedule.id || schedule._id}
                  className="rounded-[28px] border-0 shadow-sm"
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
                  <div className="mb-5 grid gap-4 md:grid-cols-3">
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
                        {workingDays.length}
                      </div>
                    </div>
                  </div>

                  <List
                    dataSource={weekdayLabels.map((label, index) => {
                      const day = workingDays.find(
                        (item) => item.dayOfWeek === index,
                      );
                      return { label, day };
                    })}
                    renderItem={({ label, day }) => (
                      <List.Item>
                        <List.Item.Meta
                          title={label}
                          description={
                            day
                              ? day.sessions.length
                                ? formatSessionSummary(day.sessions)
                                : "Marked as working with no session blocks configured"
                              : "Not working"
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end">
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
    </div>
  );
}

export default DoctorSchedulePage;
