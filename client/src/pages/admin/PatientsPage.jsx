import {
  Alert,
  App as AntApp,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import {
  createPatient,
  getPatients,
  updatePatient,
} from '../../services/admin.js'

const { Title, Paragraph } = Typography
const defaultPageSize = 5

function PatientsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: defaultPageSize, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getPatients({
          search,
          page: pagination.current,
          limit: pagination.pageSize,
          includeInactive: true,
        })
        setPatients(result.items)
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

    const timeoutId = window.setTimeout(loadPatients, 250)
    return () => window.clearTimeout(timeoutId)
  }, [search, pagination.current, pagination.pageSize])

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPatient(null)
    form.resetFields()
  }

  const openCreateModal = () => {
    setEditingPatient(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true })
    setIsModalOpen(true)
  }

  const openEditModal = (patient) => {
    setEditingPatient(patient)
    form.setFieldsValue({
      name: patient.name,
      dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth) : null,
      gender: patient.gender,
      mobile: patient.mobile,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      isActive: patient.isActive,
    })
    setIsModalOpen(true)
  }

  const reloadPatients = async (nextPage = pagination.current, nextPageSize = pagination.pageSize) => {
    const result = await getPatients({
      search,
      page: nextPage,
      limit: nextPageSize,
      includeInactive: true,
    })
    setPatients(result.items)
    setPagination({
      current: result.meta.pagination?.page ?? nextPage,
      pageSize: result.meta.pagination?.limit ?? nextPageSize,
      total: result.meta.pagination?.totalItems ?? result.items.length,
    })
  }

  const handleSubmit = async (values) => {
    setIsSaving(true)

    try {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
      }

      if (editingPatient) {
        await updatePatient(editingPatient.id || editingPatient._id, payload)
        message.success('Patient updated successfully')
      } else {
        await createPatient(payload)
        message.success('Patient created successfully')
      }

      await reloadPatients()
      closeModal()
    } catch (saveError) {
      message.error(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title level={3} className="!mb-2">Patients</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Search patients by number, name, mobile, or email.
          </Paragraph>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
          <Input.Search
            size="large"
            placeholder="Search patients"
            allowClear
            className="w-full lg:w-80"
            enterButton={<Button size="large" icon={<SearchOutlined />} className="!px-4" />}
            onChange={(event) => {
              setSearch(event.target.value)
              setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
            }}
          />
          <Button type="primary" size="large" onClick={openCreateModal}>
            Create Patient
          </Button>
        </div>
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        loading={isLoading}
        dataSource={patients}
        scroll={{ x: 980 }}
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
        size="middle"
        columns={[
          { title: 'Patient No.', dataIndex: 'patientNumber', key: 'patientNumber', width: 180 },
          { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
          { title: 'Gender', dataIndex: 'gender', key: 'gender', width: 130 },
          { title: 'DOB', dataIndex: 'dateOfBirth', key: 'dateOfBirth', width: 140 },
          { title: 'Mobile', dataIndex: 'mobile', key: 'mobile', width: 150 },
          { title: 'Email', dataIndex: 'email', key: 'email', width: 220, render: (value) => value || 'Not provided' },
          { title: 'Status', key: 'status', width: 120, render: (_, record) => <Tag color={record.isActive ? 'green' : 'default'}>{record.isActive ? 'Active' : 'Inactive'}</Tag> },
          { title: 'Action', key: 'action', width: 120, render: (_, record) => <Button onClick={() => openEditModal(record)}>Edit</Button> },
        ]}
      />

      <Modal
        title={editingPatient ? 'Update patient' : 'Create patient'}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingPatient ? 'Update' : 'Create'}
        confirmLoading={isSaving}
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item label="Patient name" name="name" rules={[{ required: true, message: 'Patient name is required' }]}>
              <Input placeholder="Asha Kumar" />
            </Form.Item>
            <Form.Item label="Date of birth" name="dateOfBirth" rules={[{ required: true, message: 'Date of birth is required' }]}>
              <DatePicker className="!w-full" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item label="Gender" name="gender" rules={[{ required: true, message: 'Gender is required' }]}>
              <Select options={['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'].map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item label="Mobile" name="mobile" rules={[{ required: true, message: 'Mobile number is required' }]}>
              <Input placeholder="9876543210" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="patient@email.com" />
            </Form.Item>
            <Form.Item label="Address" name="address">
              <Input placeholder="Address" />
            </Form.Item>
            <Form.Item label="Emergency contact name" name={['emergencyContact', 'name']}>
              <Input placeholder="Contact person" />
            </Form.Item>
            <Form.Item label="Relationship" name={['emergencyContact', 'relationship']}>
              <Input placeholder="Mother" />
            </Form.Item>
            <Form.Item label="Emergency contact mobile" name={['emergencyContact', 'mobile']} className="md:col-span-2">
              <Input placeholder="9876501234" />
            </Form.Item>
            {editingPatient ? (
              <Form.Item label="Active status" name="isActive" valuePropName="checked" className="md:col-span-2">
                <Switch />
              </Form.Item>
            ) : null}
          </div>
        </Form>
      </Modal>
    </Card>
  )
}

export default PatientsPage

