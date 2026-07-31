import { Alert, Card, Input, Space, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { getDepartments } from '../../services/admin.js'

const { Title, Paragraph, Text } = Typography

function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDepartments = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getDepartments({ search, includeInactive: true })
        setDepartments(result.items)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = window.setTimeout(loadDepartments, 250)
    return () => window.clearTimeout(timeoutId)
  }, [search])

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Title level={3} className="!mb-2">Departments</Title>
            <Paragraph className="!mb-0 !text-slate-500">
              Read and review department records. Search matches department name or code.
            </Paragraph>
          </div>
          <Input.Search placeholder="Search departments" allowClear className="w-full lg:max-w-sm" onChange={(event) => setSearch(event.target.value)} />
        </div>

        {error ? <Alert type="error" message={error} showIcon /> : null}

        <Table
          rowKey={(record) => record.id || record._id}
          loading={isLoading}
          dataSource={departments}
          pagination={{ pageSize: 8, responsive: true }}
          scroll={{ x: 760 }}
          size="middle"
          columns={[
            { title: 'Department', dataIndex: 'name', key: 'name', width: 180 },
            { title: 'Code', dataIndex: 'code', key: 'code', width: 120 },
            { title: 'Status', key: 'status', width: 120, render: (_, record) => <Tag color={record.isActive ? 'green' : 'default'}>{record.isActive ? 'Active' : 'Inactive'}</Tag> },
            { title: 'Description', key: 'description', render: (_, record) => <Text className="!text-slate-500">{record.description || 'No description'}</Text> },
          ]}
        />
      </Space>
    </Card>
  )
}

export default DepartmentsPage
