import { Alert, Card, DatePicker, Select, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { getAppointments, getDepartments } from '../../services/admin.js'

const { Title, Paragraph } = Typography
const statusColors = {
  SCHEDULED: 'blue',
  ARRIVED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [departments, setDepartments] = useState([])
  const [status, setStatus] = useState(undefined)
  const [department, setDepartment] = useState(undefined)
  const [date, setDate] = useState(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDepartments().then((result) => setDepartments(result.items)).catch(() => {})
  }, [])

  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getAppointments({
          page: 1,
          limit: 50,
          status,
          department,
          date,
        })
        setAppointments(result.items)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [status, department, date])

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6">
        <Title level={3} className="!mb-2">Appointments</Title>
        <Paragraph className="!mb-4 !text-slate-500">
          Review appointments across all departments, including patient, doctor, and visit context.
        </Paragraph>
        <div className="grid gap-4 lg:grid-cols-3">
          <Select allowClear placeholder="Filter by status" value={status} onChange={setStatus} options={['SCHEDULED', 'ARRIVED', 'COMPLETED', 'CANCELLED'].map((value) => ({ value, label: value }))} />
          <Select allowClear placeholder="Filter by department" value={department} onChange={setDepartment} options={departments.map((item) => ({ value: item.id || item._id, label: item.name }))} />
          <DatePicker className="w-full" onChange={(_, dateString) => setDate(dateString || undefined)} />
        </div>
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        loading={isLoading}
        dataSource={appointments}
        scroll={{ x: 980 }}
        pagination={{ pageSize: 8, responsive: true }}
        size="middle"
        columns={[
          {
            title: 'Patient',
            key: 'patient',
            width: 180,
            render: (_, record) => (
              <div>
                <div className="font-medium text-slate-900">{record.patient?.name}</div>
                <div className="text-slate-500">{record.patient?.patientNumber}</div>
              </div>
            ),
          },
          {
            title: 'Doctor',
            key: 'doctor',
            width: 180,
            render: (_, record) => (
              <div>
                <div className="font-medium text-slate-900">{record.doctor?.user?.name}</div>
                <div className="text-slate-500">{record.doctor?.specialization}</div>
              </div>
            ),
          },
          { title: 'Department', dataIndex: ['department', 'name'], key: 'department', width: 170 },
          { title: 'Date', dataIndex: 'appointmentDate', key: 'appointmentDate', width: 130 },
          { title: 'Time', key: 'time', width: 130, render: (_, record) => `${record.startTime} - ${record.endTime}` },
          { title: 'Status', key: 'status', width: 130, render: (_, record) => <Tag color={statusColors[record.status] || 'default'}>{record.status}</Tag> },
          { title: 'Reason', dataIndex: 'reasonForVisit', key: 'reasonForVisit', render: (value) => value || 'Not specified' },
        ]}
      />
    </Card>
  )
}

export default AppointmentsPage
