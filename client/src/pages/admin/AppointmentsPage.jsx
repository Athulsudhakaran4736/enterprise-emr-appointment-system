import {
  Alert,
  App as AntApp,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Dropdown,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import {
  cancelAppointment as actionCancelAppointment,
  completeAppointment as actionCompleteAppointment,
  createAppointment,
  getAppointments,
  getDepartments,
  getDoctors,
  getDoctorSlots,
  getPatients,
  markPatientArrived as actionMarkPatientArrived,
  updateAppointment,
} from '../../services/admin.js'
import { subscribeToAppointmentChanges } from '../../services/realtime.js'

const { Title, Paragraph } = Typography
const appointmentStatuses = ['SCHEDULED', 'ARRIVED', 'COMPLETED', 'CANCELLED']
const statusColors = {
  SCHEDULED: 'blue',
  ARRIVED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}
const defaultPageSize = 5

const formatStatusLabel = (value) =>
  value
    ?.toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown'

function AppointmentsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const [cancelForm] = Form.useForm()
  const [appointments, setAppointments] = useState([])
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [slots, setSlots] = useState([])
  const [patientMode, setPatientMode] = useState('existing')
  const [status, setStatus] = useState(undefined)
  const [department, setDepartment] = useState(undefined)
  const [date, setDate] = useState(undefined)
  const [pagination, setPagination] = useState({ current: 1, pageSize: defaultPageSize, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState('')

  const refreshAppointments = useCallback(async (nextPage = pagination.current, nextPageSize = pagination.pageSize) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await getAppointments({
        page: nextPage,
        limit: nextPageSize,
        status,
        department,
        date,
      })
      setAppointments(result.items)
      setPagination({
        current: result.meta.pagination?.page ?? nextPage,
        pageSize: result.meta.pagination?.limit ?? nextPageSize,
        total: result.meta.pagination?.totalItems ?? result.items.length,
      })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [status, department, date, pagination.current, pagination.pageSize])

  useEffect(() => {
    getDepartments({ page: 1, limit: 100 }).then((result) => setDepartments(result.items)).catch(() => {})
    getDoctors({ page: 1, limit: 100 }).then((result) => setDoctors(result.items)).catch(() => {})
    getPatients({ page: 1, limit: 100 }).then((result) => setPatients(result.items)).catch(() => {})
  }, [])

  useEffect(() => {
    refreshAppointments()
  }, [refreshAppointments])

  useEffect(() => {
    const unsubscribe = subscribeToAppointmentChanges(() => {
      refreshAppointments()
    })

    return unsubscribe
  }, [refreshAppointments])

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAppointment(null)
    setSlots([])
    setPatientMode('existing')
    form.resetFields()
  }

  const closeCancelModal = () => {
    setCancelTarget(null)
    cancelForm.resetFields()
  }

  const buildSlotOptions = (slotData, currentSlot) => {
    const availableSlots = slotData.filter((slot) => slot.status === 'AVAILABLE')

    if (!currentSlot) {
      return availableSlots
    }

    const currentExists = availableSlots.some((slot) => slot.startTime === currentSlot.startTime)

    if (currentExists) {
      return availableSlots
    }

    return [currentSlot, ...availableSlots]
  }

  const loadSlots = async (doctorId, appointmentDate, currentSlot) => {
    if (!doctorId || !appointmentDate) {
      setSlots([])
      return
    }

    setIsLoadingSlots(true)

    try {
      const result = await getDoctorSlots({ doctorId, date: appointmentDate })
      const slotData = result.data?.slots ?? []
      setSlots(buildSlotOptions(slotData, currentSlot))
    } catch {
      setSlots(currentSlot ? [currentSlot] : [])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const openCreateModal = () => {
    setEditingAppointment(null)
    setPatientMode('existing')
    setSlots([])
    form.resetFields()
    setIsModalOpen(true)
  }

  const openEditModal = (appointment) => {
    setEditingAppointment(appointment)
    const currentSlot = {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: 'AVAILABLE',
    }

    form.setFieldsValue({
      doctorId: appointment.doctor?.id || appointment.doctor?._id,
      appointmentDate: appointment.appointmentDate ? dayjs(appointment.appointmentDate) : null,
      startTime: appointment.startTime,
      reasonForVisit: appointment.reasonForVisit,
      notes: appointment.notes,
    })
    setSlots([currentSlot])
    loadSlots(
      appointment.doctor?.id || appointment.doctor?._id,
      appointment.appointmentDate,
      currentSlot,
    )
    setIsModalOpen(true)
  }

  const handleValuesChange = (changedValues, allValues) => {
    const doctorChanged = Object.prototype.hasOwnProperty.call(changedValues, 'doctorId')
    const dateChanged = Object.prototype.hasOwnProperty.call(changedValues, 'appointmentDate')

    if (!doctorChanged && !dateChanged) {
      return
    }

    form.setFieldValue('startTime', undefined)

    if (allValues.doctorId && allValues.appointmentDate) {
      loadSlots(allValues.doctorId, allValues.appointmentDate.format('YYYY-MM-DD'))
      return
    }

    setSlots([])
  }

  const handleSubmit = async (values) => {
    setIsSaving(true)

    try {
      if (editingAppointment) {
        const payload = {
          doctorId: values.doctorId,
          appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
          startTime: values.startTime,
          reasonForVisit: values.reasonForVisit,
          notes: values.notes,
        }

        await updateAppointment(editingAppointment.id || editingAppointment._id, payload)
        message.success('Appointment updated successfully')
      } else {
        const payload = {
          doctorId: values.doctorId,
          appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
          startTime: values.startTime,
          reasonForVisit: values.reasonForVisit,
          notes: values.notes,
        }

        if (patientMode === 'existing') {
          payload.patientId = values.patientId
        } else {
          payload.patient = {
            ...values.patient,
            dateOfBirth: values.patient.dateOfBirth.format('YYYY-MM-DD'),
          }
        }

        await createAppointment(payload)
        const patientsResult = await getPatients({ page: 1, limit: 100 })
        setPatients(patientsResult.items)
        message.success('Appointment created successfully')
      }

      await refreshAppointments()
      closeModal()
    } catch (saveError) {
      message.error(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkArrived = async (appointmentId) => {
    setActionLoadingId(appointmentId)

    try {
      await actionMarkPatientArrived(appointmentId)
      await refreshAppointments()
      message.success('Patient marked as arrived')
    } catch (actionError) {
      message.error(actionError.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleComplete = async (appointmentId) => {
    setActionLoadingId(appointmentId)

    try {
      await actionCompleteAppointment(appointmentId)
      await refreshAppointments()
      message.success('Appointment marked as completed')
    } catch (actionError) {
      message.error(actionError.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancel = async (values) => {
    const appointmentId = cancelTarget?.id || cancelTarget?._id

    if (!appointmentId) {
      return
    }

    setActionLoadingId(appointmentId)

    try {
      await actionCancelAppointment(appointmentId, values.cancellationReason)
      await refreshAppointments()
      message.success('Appointment cancelled successfully')
      closeCancelModal()
    } catch (actionError) {
      message.error(actionError.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const getActionItems = (record) => {
    const appointmentId = record.id || record._id
    const isLocked = actionLoadingId === appointmentId
    const items = []

    if (record.status !== 'CANCELLED' && record.status !== 'COMPLETED') {
      items.push({ key: 'edit', label: 'Edit', disabled: isLocked })
    }

    if (record.status === 'SCHEDULED') {
      items.push({ key: 'arrive', label: 'Mark as arrived', disabled: isLocked })
    }

    if (record.status === 'ARRIVED') {
      items.push({ key: 'complete', label: 'Mark as completed', disabled: isLocked })
    }

    if (record.status === 'SCHEDULED' || record.status === 'ARRIVED') {
      items.push({ key: 'cancel', label: 'Cancel appointment', danger: true, disabled: isLocked })
    }

    if (!items.length) {
      items.push({ key: 'empty', label: 'No actions available', disabled: true })
    }

    return items
  }

  const handleActionClick = ({ key }, record) => {
    const appointmentId = record.id || record._id

    if (key === 'edit') {
      openEditModal(record)
      return
    }

    if (key === 'arrive') {
      handleMarkArrived(appointmentId)
      return
    }

    if (key === 'complete') {
      handleComplete(appointmentId)
      return
    }

    if (key === 'cancel') {
      setCancelTarget(record)
    }
  }

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title level={3} className="!mb-2">Appointments</Title>
          <Paragraph className="!mb-4 !text-slate-500">
            Review appointments across all departments, including patient, doctor, and visit context.
          </Paragraph>
        </div>
        <Button type="primary" size="large" onClick={openCreateModal}>
          Create Appointment
        </Button>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Select
          allowClear
          placeholder="Filter by status"
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
          }}
          options={appointmentStatuses.map((value) => ({ value, label: formatStatusLabel(value) }))}
        />
        <Select
          allowClear
          placeholder="Filter by department"
          value={department}
          onChange={(value) => {
            setDepartment(value)
            setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
          }}
          options={departments.map((item) => ({ value: item.id || item._id, label: item.name }))}
        />
        <DatePicker
          className="w-full"
          onChange={(_, dateString) => {
            setDate(dateString || undefined)
            setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
          }}
        />
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Table
        rowKey={(record) => record.id || record._id}
        loading={isLoading}
        dataSource={appointments}
        scroll={{ x: 1260 }}
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
          { title: 'Status', key: 'status', width: 140, render: (_, record) => <Tag color={statusColors[record.status] || 'default'}>{formatStatusLabel(record.status)}</Tag> },
          { title: 'Reason', dataIndex: 'reasonForVisit', key: 'reasonForVisit', width: 220, render: (value) => value || 'Not specified' },
          {
            title: 'Actions',
            key: 'actions',
            width: 120,
            align: 'center',
            render: (_, record) => {
              const appointmentId = record.id || record._id
              const loading = actionLoadingId === appointmentId

              return (
                <Dropdown trigger={['click']} menu={{ items: getActionItems(record), onClick: (info) => handleActionClick(info, record) }}>
                  <Button aria-label={`Actions for appointment ${appointmentId}`} loading={loading} icon={<MoreOutlined />} />
                </Dropdown>
              )
            },
          },
        ]}
      />

      <Modal
        title={editingAppointment ? 'Update appointment' : 'Create appointment'}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingAppointment ? 'Update' : 'Create'}
        confirmLoading={isSaving}
        width={860}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleValuesChange} initialValues={{ patientMode: 'existing' }}>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <Form.Item label="Doctor" name="doctorId" rules={[{ required: true, message: 'Doctor is required' }]}>
              <Select placeholder="Select doctor" options={doctors.map((doctor) => ({ value: doctor.id || doctor._id, label: `${doctor.user?.name} - ${doctor.specialization}` }))} />
            </Form.Item>
            <Form.Item label="Appointment date" name="appointmentDate" rules={[{ required: true, message: 'Appointment date is required' }]}>
              <DatePicker className="!w-full" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item label="Available slot" name="startTime" rules={[{ required: true, message: 'Start time is required' }]}>
              <Select loading={isLoadingSlots} placeholder="Select time" options={slots.map((slot) => ({ value: slot.startTime, label: `${slot.startTime} - ${slot.endTime}` }))} />
            </Form.Item>
            <Form.Item label="Reason for visit" name="reasonForVisit">
              <Input placeholder="General consultation" />
            </Form.Item>
          </div>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>

          {editingAppointment ? (
            <Descriptions size="small" column={1} bordered className="mb-4">
              <Descriptions.Item label="Patient">{editingAppointment.patient?.name} ({editingAppointment.patient?.patientNumber})</Descriptions.Item>
              <Descriptions.Item label="Status">{formatStatusLabel(editingAppointment.status)}</Descriptions.Item>
            </Descriptions>
          ) : (
            <>
              <Form.Item label="Patient type" name="patientMode">
                <Radio.Group onChange={(event) => setPatientMode(event.target.value)}>
                  <Radio value="existing">Existing patient</Radio>
                  <Radio value="new">New patient</Radio>
                </Radio.Group>
              </Form.Item>

              {patientMode === 'existing' ? (
                <Form.Item label="Patient" name="patientId" rules={[{ required: true, message: 'Patient is required' }]}>
                  <Select placeholder="Select patient" showSearch optionFilterProp="label" options={patients.map((patient) => ({ value: patient.id || patient._id, label: `${patient.patientNumber} - ${patient.name}` }))} />
                </Form.Item>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Form.Item label="Patient name" name={['patient', 'name']} rules={[{ required: true, message: 'Patient name is required' }]}>
                    <Input placeholder="New patient name" />
                  </Form.Item>
                  <Form.Item label="Date of birth" name={['patient', 'dateOfBirth']} rules={[{ required: true, message: 'Date of birth is required' }]}>
                    <DatePicker className="!w-full" format="YYYY-MM-DD" />
                  </Form.Item>
                  <Form.Item label="Gender" name={['patient', 'gender']} rules={[{ required: true, message: 'Gender is required' }]}>
                    <Select options={['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'].map((value) => ({ value, label: value }))} />
                  </Form.Item>
                  <Form.Item label="Mobile" name={['patient', 'mobile']} rules={[{ required: true, message: 'Mobile number is required' }]}>
                    <Input placeholder="9876543210" />
                  </Form.Item>
                  <Form.Item label="Email" name={['patient', 'email']}>
                    <Input placeholder="patient@email.com" />
                  </Form.Item>
                  <Form.Item label="Address" name={['patient', 'address']}>
                    <Input placeholder="Address" />
                  </Form.Item>
                  <Form.Item label="Emergency contact name" name={['patient', 'emergencyContact', 'name']}>
                    <Input placeholder="Contact person" />
                  </Form.Item>
                  <Form.Item label="Relationship" name={['patient', 'emergencyContact', 'relationship']}>
                    <Input placeholder="Father" />
                  </Form.Item>
                  <Form.Item label="Emergency contact mobile" name={['patient', 'emergencyContact', 'mobile']} className="md:col-span-2">
                    <Input placeholder="9876501234" />
                  </Form.Item>
                </div>
              )}
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="Cancel appointment"
        open={Boolean(cancelTarget)}
        onCancel={closeCancelModal}
        onOk={() => cancelForm.submit()}
        okText="Cancel appointment"
        okButtonProps={{ danger: true, loading: actionLoadingId === (cancelTarget?.id || cancelTarget?._id) }}
      >
        <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
          <Form.Item label="Cancellation reason" name="cancellationReason" rules={[{ required: true, message: 'Cancellation reason is required' }]}>
            <Input.TextArea rows={4} placeholder="Provide a reason for cancellation" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default AppointmentsPage
