import { Alert, Card, Input, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { getPatients } from '../../services/admin.js'

const { Title, Paragraph } = Typography

function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getPatients({ search, page: 1, limit: 50, includeInactive: true })
        setPatients(result.items)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = window.setTimeout(loadPatients, 250)
    return () => window.clearTimeout(timeoutId)
  }, [search])

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title level={3} className="!mb-2">Patients</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Search patients by number, name, mobile, or email.
          </Paragraph>
        </div>
        <Input.Search placeholder="Search patients" allowClear className="w-full lg:max-w-sm" onChange={(event) => setSearch(event.target.value)} />
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        loading={isLoading}
        dataSource={patients}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 8, responsive: true }}
        size="middle"
        columns={[
          { title: 'Patient No.', dataIndex: 'patientNumber', key: 'patientNumber', width: 180 },
          { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
          { title: 'Gender', dataIndex: 'gender', key: 'gender', width: 130 },
          { title: 'DOB', dataIndex: 'dateOfBirth', key: 'dateOfBirth', width: 140 },
          { title: 'Mobile', dataIndex: 'mobile', key: 'mobile', width: 150 },
          { title: 'Email', dataIndex: 'email', key: 'email', width: 220, render: (value) => value || 'Not provided' },
          { title: 'Status', key: 'status', width: 120, render: (_, record) => <Tag color={record.isActive ? 'green' : 'default'}>{record.isActive ? 'Active' : 'Inactive'}</Tag> },
        ]}
      />
    </Card>
  )
}

export default PatientsPage
