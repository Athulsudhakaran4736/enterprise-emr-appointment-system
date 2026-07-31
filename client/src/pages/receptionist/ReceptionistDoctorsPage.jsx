import { Alert, Card, Input, Spin, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { getDoctors } from "../../services/admin.js";

const { Title, Paragraph } = Typography;

function ReceptionistDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true);
      setError("");

      try {
        const result = await getDoctors({
          page: 1,
          limit: 100,
          search: search || undefined,
        });
        setDoctors(result.items);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = window.setTimeout(loadDoctors, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title level={3} className="!mb-2">
            Doctors
          </Title>
        </div>
        <Input.Search
          placeholder="Search by doctor, email, specialization, or registration number"
          className="max-w-xl"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error ? (
        <Alert type="error" message={error} showIcon className="mb-4" />
      ) : null}

      <Table
        rowKey={(record) => record.id || record._id}
        dataSource={doctors}
        pagination={{ pageSize: 10, responsive: true }}
        scroll={{ x: 980 }}
        columns={[
          {
            title: "Doctor",
            key: "doctor",
            width: 220,
            render: (_, record) => (
              <div>
                <div className="font-medium text-slate-900">
                  {record.user?.name}
                </div>
                <div className="text-slate-500">{record.user?.email}</div>
              </div>
            ),
          },
          {
            title: "Department",
            dataIndex: ["department", "name"],
            key: "department",
            width: 160,
          },
          {
            title: "Specialization",
            dataIndex: "specialization",
            key: "specialization",
            width: 220,
          },
          {
            title: "Registration",
            dataIndex: "registrationNumber",
            key: "registrationNumber",
            width: 160,
          },
          {
            title: "Consultation",
            key: "consultationDuration",
            width: 150,
            render: (_, record) => `${record.consultationDuration} min`,
          },
          {
            title: "Status",
            key: "status",
            width: 120,
            render: (_, record) => (
              <Tag
                color={
                  record.isActive && record.user?.isActive ? "green" : "default"
                }
              >
                {record.isActive && record.user?.isActive
                  ? "Active"
                  : "Inactive"}
              </Tag>
            ),
          },
        ]}
      />
    </Card>
  );
}

export default ReceptionistDoctorsPage;
