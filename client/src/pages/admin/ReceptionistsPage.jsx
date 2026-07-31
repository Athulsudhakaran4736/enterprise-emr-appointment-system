import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useState } from 'react'
import { createReceptionist, getUsers } from '../../services/admin.js'

const { Title, Paragraph } = Typography

function ReceptionistsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const [receptionists, setReceptionists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const handleCreateReceptionist = async (values) => {
    setIsCreating(true)

    try {
      await createReceptionist(values)
      const result = await getUsers({ role: 'RECEPTIONIST', page: 1, limit: 50 })
      setReceptionists(result.items)
      message.success('Receptionist created successfully')
      setIsModalOpen(false)
      form.resetFields()
    } catch (createError) {
      message.error(createError.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title level={3} className="!mb-2">Receptionists</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Admin-only view of receptionist user accounts from the `/users` endpoint.
          </Paragraph>
        </div>
        <Button type="primary" size="large" onClick={() => setIsModalOpen(true)}>
          Create Receptionist
        </Button>
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

      <Modal
        title="Create receptionist"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText="Create"
        confirmLoading={isCreating}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateReceptionist}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Front desk executive" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email address' }]}>
            <Input placeholder="reception@hospital.com" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required' }, { min: 8, message: 'Password must contain at least 8 characters' }]}>
            <Input.Password placeholder="Minimum 8 characters" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default ReceptionistsPage
