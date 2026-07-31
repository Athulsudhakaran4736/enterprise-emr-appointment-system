import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useState } from 'react'
import {
  createDoctor,
  getDepartments,
  getDoctors,
  updateDoctor,
} from '../../services/admin.js'

const { Title, Paragraph } = Typography

function DoctorsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDepartments({ includeInactive: false })
      .then((result) => {
        setDepartments(result.items)
      })
      .catch(() => {})
  }, [])

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

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingDoctor(null)
    form.resetFields()
  }

  const openCreateModal = () => {
    setEditingDoctor(null)
    form.resetFields()
    form.setFieldsValue({ consultationDuration: 15 })
    setIsModalOpen(true)
  }

  const openEditModal = (doctor) => {
    setEditingDoctor(doctor)
    form.setFieldsValue({
      name: doctor.user?.name,
      department: doctor.department?.id || doctor.department?._id,
      specialization: doctor.specialization,
      registrationNumber: doctor.registrationNumber,
      qualification: doctor.qualification,
      consultationDuration: doctor.consultationDuration,
      isActive: doctor.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (values) => {
    setIsSaving(true)

    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id || editingDoctor._id, values)
        message.success('Doctor updated successfully')
      } else {
        await createDoctor(values)
        message.success('Doctor created successfully')
      }

      const result = await getDoctors({ search, page: 1, limit: 50 })
      setDoctors(result.items)
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
          <Title level={3} className="!mb-2">Doctors</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Search doctor profiles by name, email, specialization, or registration number.
          </Paragraph>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
          <Input.Search
            placeholder="Search doctors"
            allowClear
            className="w-full lg:w-80"
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="primary" size="large" onClick={openCreateModal}>
            Create Doctor
          </Button>
        </div>
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        loading={isLoading}
        dataSource={doctors}
        pagination={{ pageSize: 8, responsive: true }}
        scroll={{ x: 980 }}
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
          {
            title: 'Department',
            dataIndex: ['department', 'name'],
            key: 'department',
            width: 180,
          },
          {
            title: 'Specialization',
            dataIndex: 'specialization',
            key: 'specialization',
            width: 200,
          },
          {
            title: 'Registration',
            dataIndex: 'registrationNumber',
            key: 'registrationNumber',
            width: 180,
          },
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
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
              <Button onClick={() => openEditModal(record)}>Edit</Button>
            ),
          },
        ]}
      />

      <Modal
        title={editingDoctor ? 'Update doctor' : 'Create doctor'}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingDoctor ? 'Update' : 'Create'}
        confirmLoading={isSaving}
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item label="Doctor name" name="name" rules={[{ required: true, message: 'Doctor name is required' }]}>
              <Input placeholder="Dr. Meera Nair" />
            </Form.Item>
            {!editingDoctor ? (
              <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email address' }]}>
                <Input placeholder="doctor@hospital.com" />
              </Form.Item>
            ) : null}
            {!editingDoctor ? (
              <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required' }, { min: 8, message: 'Password must contain at least 8 characters' }]}>
                <Input.Password placeholder="Minimum 8 characters" />
              </Form.Item>
            ) : null}
            <Form.Item label="Department" name="department" rules={[{ required: true, message: 'Department is required' }]}>
              <Select placeholder="Select department" options={departments.map((department) => ({ value: department.id || department._id, label: `${department.name} (${department.code})` }))} />
            </Form.Item>
            <Form.Item label="Specialization" name="specialization" rules={[{ required: true, message: 'Specialization is required' }]}>
              <Input placeholder="Cardiology" />
            </Form.Item>
            <Form.Item label="Registration number" name="registrationNumber" rules={[{ required: true, message: 'Registration number is required' }]}>
              <Input placeholder="MED-45882" />
            </Form.Item>
            <Form.Item label="Qualification" name="qualification">
              <Input placeholder="MBBS, MD" />
            </Form.Item>
            <Form.Item label="Consultation duration (minutes)" name="consultationDuration">
              <InputNumber className="!w-full" min={5} max={180} />
            </Form.Item>
            {editingDoctor ? (
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

export default DoctorsPage
