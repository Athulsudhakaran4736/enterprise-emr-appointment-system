import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useState } from 'react'
import {
  createDepartment,
  getDepartments,
  updateDepartment,
} from '../../services/admin.js'

const { Title, Paragraph, Text } = Typography

function DepartmentsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
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

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingDepartment(null)
    form.resetFields()
  }

  const openCreateModal = () => {
    setEditingDepartment(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true })
    setIsModalOpen(true)
  }

  const openEditModal = (department) => {
    setEditingDepartment(department)
    form.setFieldsValue({
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (values) => {
    setIsSaving(true)

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id || editingDepartment._id, values)
        message.success('Department updated successfully')
      } else {
        await createDepartment({
          name: values.name,
          code: values.code,
          description: values.description,
        })
        message.success('Department created successfully')
      }

      const result = await getDepartments({ search, includeInactive: true })
      setDepartments(result.items)
      closeModal()
    } catch (saveError) {
      message.error(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

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
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <Input.Search
              placeholder="Search departments"
              allowClear
              className="w-full lg:w-80"
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button type="primary" size="large" onClick={openCreateModal}>
              Create Department
            </Button>
          </div>
        </div>

        {error ? <Alert type="error" message={error} showIcon /> : null}

        <Table
          rowKey={(record) => record.id || record._id}
          loading={isLoading}
          dataSource={departments}
          pagination={{ pageSize: 8, responsive: true }}
          scroll={{ x: 900 }}
          size="middle"
          columns={[
            { title: 'Department', dataIndex: 'name', key: 'name', width: 180 },
            { title: 'Code', dataIndex: 'code', key: 'code', width: 120 },
            {
              title: 'Status',
              key: 'status',
              width: 120,
              render: (_, record) => (
                <Tag color={record.isActive ? 'green' : 'default'}>
                  {record.isActive ? 'Active' : 'Inactive'}
                </Tag>
              ),
            },
            {
              title: 'Description',
              key: 'description',
              render: (_, record) => (
                <Text className="!text-slate-500">
                  {record.description || 'No description'}
                </Text>
              ),
            },
            {
              title: 'Action',
              key: 'action',
              width: 120,
              render: (_, record) => (
                <Button onClick={() => openEditModal(record)}>Edit</Button>
              ),
            },
          ]}
        />
      </Space>

      <Modal
        title={editingDepartment ? 'Update department' : 'Create department'}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingDepartment ? 'Update' : 'Create'}
        confirmLoading={isSaving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Department name" name="name" rules={[{ required: true, message: 'Department name is required' }]}>
            <Input placeholder="Cardiology" />
          </Form.Item>
          <Form.Item label="Department code" name="code" rules={[{ required: true, message: 'Department code is required' }]}>
            <Input placeholder="CARD" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
          {editingDepartment ? (
            <Form.Item label="Active status" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </Card>
  )
}

export default DepartmentsPage
