import { Alert, Card, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { getUsers } from '../../services/admin.js'

const { Title, Paragraph } = Typography

function ReceptionistsPage() {
  const [receptionists, setReceptionists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadReceptionists = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getUsers({ role: 'RECEPTIONIST', page: 1, limit: 50 })
        setReceptionists(result.items)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadReceptionists()
  }, [])

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6">
        <Title level={3} className="!mb-2">Receptionists</Title>
        <Paragraph className="!mb-0 !text-slate-500">
          Admin-only view of receptionist user accounts from the `/users` endpoint.
        </Paragraph>
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        loading={isLoading}
        dataSource={receptionists}
        pagination={{ pageSize: 8, responsive: true }}
        scroll={{ x: 760 }}
        size="middle"
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
          { title: 'Email', dataIndex: 'email', key: 'email', width: 220 },
          { title: 'Role', dataIndex: 'role', key: 'role', width: 140, render: (value) => <Tag color="cyan">{value}</Tag> },
          { title: 'Status', key: 'status', width: 120, render: (_, record) => <Tag color={record.isActive ? 'green' : 'default'}>{record.isActive ? 'Active' : 'Inactive'}</Tag> },
          { title: 'Last Login', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 190, render: (value) => value ? new Date(value).toLocaleString() : 'Never' },
        ]}
      />
    </Card>
  )
}

export default ReceptionistsPage
