import { Alert, Card, Input, Spin, Table, Tag, Typography, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { getDoctors } from '../../services/admin.js'

const { Title, Paragraph } = Typography
const defaultPageSize = 5

function ReceptionistDoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: defaultPageSize, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getDoctors({
          page: pagination.current,
          limit: pagination.pageSize,
          search: search || undefined,
        })
        setDoctors(result.items)
        setPagination((currentPagination) => ({
          ...currentPagination,
          total: result.meta.pagination?.totalItems ?? result.items.length,
        }))
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = window.setTimeout(loadDoctors, 250)
    return () => window.clearTimeout(timer)
  }, [search, pagination.current, pagination.pageSize])

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title level={3} className="!mb-2">Doctors</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Read-only directory of active doctors for appointment booking and availability checks.
          </Paragraph>
        </div>
        <Input.Search
          size="large"
          placeholder="Search by doctor, email, specialization, or registration number"
          className="max-w-xl"
          allowClear
          value={search}
          enterButton={<Button size="large" icon={<SearchOutlined />} className="!px-4" />}
          onChange={(event) => {
            setSearch(event.target.value)
            setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
          }}
        />
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        dataSource={doctors}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          responsive: true,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total })
          },
        }}
        scroll={{ x: 980 }}
        columns={[
          {
            title: 'Doctor',
            key: 'doctor',
            width: 220,
            render: (_, record) => (
              <div>
                <div className="font-medium text-slate-900">{record.user?.name}</div>
                <div className="text-slate-500">{record.user?.email}</div>
              </div>
            ),
          },
          { title: 'Department', dataIndex: ['department', 'name'], key: 'department', width: 160 },
          { title: 'Specialization', dataIndex: 'specialization', key: 'specialization', width: 220 },
          { title: 'Registration', dataIndex: 'registrationNumber', key: 'registrationNumber', width: 160 },
          { title: 'Consultation', key: 'consultationDuration', width: 150, render: (_, record) => `${record.consultationDuration} min` },
          {
            title: 'Status',
            key: 'status',
            width: 120,
            render: (_, record) => <Tag color={record.isActive && record.user?.isActive ? 'green' : 'default'}>{record.isActive && record.user?.isActive ? 'Active' : 'Inactive'}</Tag>,
          },
        ]}
      />
    </Card>
  )
}

export default ReceptionistDoctorsPage

