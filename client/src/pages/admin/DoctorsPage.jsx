import { Alert, Card, Input, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { getDoctors } from '../../services/admin.js'

const { Title, Paragraph } = Typography

function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getDoctors({ search, page: 1, limit: 50 })
        setDoctors(result.items)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = window.setTimeout(loadDoctors, 250)
    return () => window.clearTimeout(timeoutId)
  }, [search])

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title level={3} className="!mb-2">Doctors</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Search doctor profiles by name, email, specialization, or registration number.
          </Paragraph>
        </div>
        <Input.Search placeholder="Search doctors" allowClear className="w-full lg:max-w-sm" onChange={(event) => setSearch(event.target.value)} />
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        loading={isLoading}
        dataSource={doctors}
        pagination={{ pageSize: 8, responsive: true }}
        scroll={{ x: 900 }}
        size="middle"
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
          { title: 'Department', dataIndex: ['department', 'name'], key: 'department', width: 180 },
          { title: 'Specialization', dataIndex: 'specialization', key: 'specialization', width: 200 },
          { title: 'Registration', dataIndex: 'registrationNumber', key: 'registrationNumber', width: 180 },
          { title: 'Status', key: 'status', width: 120, render: (_, record) => <Tag color={record.isActive ? 'green' : 'default'}>{record.isActive ? 'Active' : 'Inactive'}</Tag> },
        ]}
      />
    </Card>
  )
}

export default DoctorsPage
