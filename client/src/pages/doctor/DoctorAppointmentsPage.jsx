import { Alert, Button, Card, DatePicker, Select, Spin, Table, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyAppointments } from '../../services/doctor.js'
import { appointmentStatusColors, formatStatusLabel, formatTimeRange } from './doctor-utils.js'

const { Title, Paragraph } = Typography
const appointmentStatuses = ['SCHEDULED', 'ARRIVED', 'COMPLETED', 'CANCELLED']
const defaultPageSize = 5

function DoctorAppointmentsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [status, setStatus] = useState(undefined)
  const [date, setDate] = useState(undefined)
  const [pagination, setPagination] = useState({ current: 1, pageSize: defaultPageSize, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getMyAppointments({
          page: pagination.current,
          limit: pagination.pageSize,
          status,
          date,
        })
        setAppointments(result.items)
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

    loadAppointments()
  }, [status, date, pagination.current, pagination.pageSize])

  const columns = useMemo(
    () => [
      {
        title: 'Patient',
        key: 'patient',
        width: 180,
        render: (_, record) => (
          <div>
            <div className="font-medium text-slate-900">{record.patient?.name || 'Unknown patient'}</div>
            <div className="text-slate-500">{record.patient?.patientNumber || 'No patient number'}</div>
          </div>
        ),
      },
      { title: 'Department', key: 'department', dataIndex: ['department', 'name'], width: 170 },
      { title: 'Date', key: 'appointmentDate', dataIndex: 'appointmentDate', width: 130 },
      { title: 'Time', key: 'time', width: 140, render: (_, record) => formatTimeRange(record.startTime, record.endTime) },
      {
        title: 'Status',
        key: 'status',
        width: 140,
        render: (_, record) => <Tag color={appointmentStatusColors[record.status] || 'default'}>{formatStatusLabel(record.status)}</Tag>,
      },
      { title: 'Reason', key: 'reasonForVisit', dataIndex: 'reasonForVisit', width: 220, render: (value) => value || 'Not specified' },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => <Button onClick={() => navigate(`/doctor/appointments/${record.id || record._id}`)}>View</Button>,
      },
    ],
    [navigate],
  )

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
          <Title level={3} className="!mb-2">My Appointments</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Review only the appointments assigned to your doctor profile.
          </Paragraph>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Select
          allowClear
          placeholder="Filter by status"
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
          }}
          options={appointmentStatuses.map((value) => ({ value, label: formatStatusLabel(value) }))}
        />
        <DatePicker
          className="w-full"
          onChange={(_, dateString) => {
            setDate(dateString || undefined)
            setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
          }}
        />
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        dataSource={appointments}
        columns={columns}
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
        scroll={{ x: 1080 }}
      />
    </Card>
  )
}

export default DoctorAppointmentsPage

