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
import { SearchOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import {
  createDepartment,
  getDepartments,
  updateDepartment,
} from '../../services/admin.js'

const { Title, Paragraph, Text } = Typography
const defaultPageSize = 5

function DepartmentsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: defaultPageSize, total: 0 })
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
        const result = await getDepartments({
          search,
          includeInactive: true,
          page: pagination.current,
          limit: pagination.pageSize,
        })
        setDepartments(result.items)
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

    const timeoutId = window.setTimeout(loadDepartments, 250)
    return () => window.clearTimeout(timeoutId)
  }, [search, pagination.current, pagination.pageSize])

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

  const reloadDepartments = async (nextPage = pagination.current, nextPageSize = pagination.pageSize) => {
    const result = await getDepartments({
      search,
      includeInactive: true,
      page: nextPage,
      limit: nextPageSize,
    })
    setDepartments(result.items)
    setPagination({
      current: result.meta.pagination?.page ?? nextPage,
      pageSize: result.meta.pagination?.limit ?? nextPageSize,
      total: result.meta.pagination?.totalItems ?? result.items.length,
    })
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

      await reloadDepartments()
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
              size="large"
              placeholder="Search departments"
              allowClear
              className="w-full lg:w-80"
              enterButton={<Button size="large" icon={<SearchOutlined />} className="!px-4" />}
              onChange={(event) => {
                setSearch(event.target.value)
                setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
              }}
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
              render: (_, record) => <Button onClick={() => openEditModal(record)}>Edit</Button>,
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

