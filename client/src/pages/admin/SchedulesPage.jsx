import {
  Alert,
  App as AntApp,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  InputNumber,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  TimePicker,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { createSchedule, getDoctorSchedules, getDoctors, updateSchedule } from '../../services/admin.js'
import { formatSessionSummary } from '../../utils/formatters.js'

const { Title, Paragraph } = Typography
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const timezoneOptions = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata' },
  { value: 'UTC', label: 'UTC' },
]
const defaultPageSize = 5

const createDefaultWorkingDays = () =>
  dayLabels.map((_, index) => ({
    dayOfWeek: index,
    isWorking: index > 0 && index < 6,
    sessions: [{ startTime: dayjs('09:00', 'HH:mm'), endTime: dayjs('17:00', 'HH:mm'), breaks: [] }],
  }))

const mapBreaksToForm = (breaks = []) =>
  breaks.map((currentBreak) => ({
    startTime: currentBreak.startTime ? dayjs(currentBreak.startTime, 'HH:mm') : null,
    endTime: currentBreak.endTime ? dayjs(currentBreak.endTime, 'HH:mm') : null,
  }))

const mapBreaksToPayload = (breaks = []) =>
  breaks
    .filter((currentBreak) => currentBreak?.startTime && currentBreak?.endTime)
    .map((currentBreak) => ({
      startTime: currentBreak.startTime.format('HH:mm'),
      endTime: currentBreak.endTime.format('HH:mm'),
    }))

function SchedulesPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: defaultPageSize, total: 0 })
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [error, setError] = useState('')

  const selectedDoctorLabel = useMemo(
    () => doctors.find((doctor) => (doctor.id || doctor._id) === selectedDoctorId),
    [doctors, selectedDoctorId],
  )

  const loadSchedules = async (doctorId, nextPage = pagination.current, nextPageSize = pagination.pageSize) => {
    if (!doctorId) {
      setSchedules([])
      return
    }

    setIsLoadingSchedules(true)
    setError('')

    try {
      const result = await getDoctorSchedules(doctorId, {
        includeInactive: true,
        page: nextPage,
        limit: nextPageSize,
      })
      setSchedules(result.items)
      setPagination({
        current: result.meta.pagination?.page ?? nextPage,
        pageSize: result.meta.pagination?.limit ?? nextPageSize,
        total: result.meta.pagination?.totalItems ?? result.items.length,
      })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoadingSchedules(false)
    }
  }

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoadingDoctors(true)
      setError('')

      try {
        const result = await getDoctors({ page: 1, limit: 100 })
        setDoctors(result.items)
        if (result.items[0]) {
          setSelectedDoctorId(result.items[0].id || result.items[0]._id)
        }
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoadingDoctors(false)
      }
    }

    loadDoctors()
  }, [])

  useEffect(() => {
    if (selectedDoctorId) {
      loadSchedules(selectedDoctorId)
    }
  }, [selectedDoctorId, pagination.current, pagination.pageSize])

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSchedule(null)
    form.resetFields()
  }

  const openCreateModal = () => {
    setEditingSchedule(null)
    form.resetFields()
    form.setFieldsValue({
      doctor: selectedDoctorId,
      timezone: 'Asia/Kolkata',
      slotDurationMinutes: 15,
      effectiveFrom: dayjs(),
      effectiveTo: null,
      isActive: true,
      workingDays: createDefaultWorkingDays(),
    })
    setIsModalOpen(true)
  }

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule)
    form.setFieldsValue({
      doctor: schedule.doctor?.id || schedule.doctor?._id,
      timezone: schedule.timezone,
      slotDurationMinutes: schedule.slotDurationMinutes,
      effectiveFrom: schedule.effectiveFrom ? dayjs(schedule.effectiveFrom) : null,
      effectiveTo: schedule.effectiveTo ? dayjs(schedule.effectiveTo) : null,
      isActive: schedule.isActive,
      workingDays: dayLabels.map((_, index) => {
        const day = schedule.workingDays.find((item) => item.dayOfWeek === index)
        const session = day?.sessions?.[0]
        return {
          dayOfWeek: index,
          isWorking: day?.isWorking ?? false,
          sessions: [
            {
              startTime: session?.startTime ? dayjs(session.startTime, 'HH:mm') : dayjs('09:00', 'HH:mm'),
              endTime: session?.endTime ? dayjs(session.endTime, 'HH:mm') : dayjs('17:00', 'HH:mm'),
              breaks: mapBreaksToForm(session?.breaks),
            },
          ],
        }
      }),
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (values) => {
    setIsSaving(true)

    try {
      const payload = {
        doctor: values.doctor,
        slotDurationMinutes: values.slotDurationMinutes,
        timezone: values.timezone,
        effectiveFrom: values.effectiveFrom.format('YYYY-MM-DD'),
        effectiveTo: values.effectiveTo ? values.effectiveTo.format('YYYY-MM-DD') : null,
        isActive: values.isActive,
        workingDays: values.workingDays.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          isWorking: Boolean(day.isWorking),
          sessions: day.isWorking
            ? [
                {
                  startTime: day.sessions?.[0]?.startTime?.format('HH:mm'),
                  endTime: day.sessions?.[0]?.endTime?.format('HH:mm'),
                  breaks: mapBreaksToPayload(day.sessions?.[0]?.breaks),
                },
              ]
            : [],
        })),
      }

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id || editingSchedule._id, payload)
        message.success('Schedule updated successfully')
      } else {
        await createSchedule(payload)
        message.success('Schedule created successfully')
      }

      await loadSchedules(values.doctor)
      if (!selectedDoctorId) {
        setSelectedDoctorId(values.doctor)
      }
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
          <Title level={3} className="!mb-2">Schedules</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Create and manage doctor working schedules, slot duration, and effective dates.
          </Paragraph>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
          <Select
            placeholder="Select doctor"
            className="w-full lg:w-[360px]"
            loading={isLoadingDoctors}
            value={selectedDoctorId}
            onChange={(value) => {
              setSelectedDoctorId(value)
              setPagination((currentPagination) => ({ ...currentPagination, current: 1 }))
            }}
            options={doctors.map((doctor) => ({
              value: doctor.id || doctor._id,
              label: `${doctor.user?.name} - ${doctor.specialization}`,
            }))}
          />
          <Button type="primary" size="large" onClick={openCreateModal} disabled={!selectedDoctorId}>
            Create Schedule
          </Button>
        </div>
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      {selectedDoctorId ? (
        <Table
          rowKey={(record) => record.id || record._id}
          loading={isLoadingSchedules}
          dataSource={schedules}
          locale={{ emptyText: <Empty description="No schedules found for the selected doctor" /> }}
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
          scroll={{ x: 1140 }}
          size="middle"
          columns={[
            { title: 'Effective From', dataIndex: 'effectiveFrom', key: 'effectiveFrom', width: 140 },
            { title: 'Effective To', dataIndex: 'effectiveTo', key: 'effectiveTo', width: 140, render: (value) => value || 'Open-ended' },
            { title: 'Timezone', dataIndex: 'timezone', key: 'timezone', width: 150 },
            { title: 'Slot Duration', dataIndex: 'slotDurationMinutes', key: 'slotDurationMinutes', width: 140, render: (value) => `${value} min` },
            { title: 'Working Days', key: 'workingDays', width: 160, render: (_, record) => record.workingDays.filter((day) => day.isWorking).map((day) => dayLabels[day.dayOfWeek]).join(', ') },
            {
              title: 'Sessions & Breaks',
              key: 'sessions',
              width: 300,
              render: (_, record) => {
                const activeDays = record.workingDays.filter((day) => day.isWorking)
                return activeDays.length
                  ? activeDays
                      .map((day) => `${dayLabels[day.dayOfWeek]}: ${formatSessionSummary(day.sessions)}`)
                      .join(' | ')
                  : 'No working sessions'
              },
            },
            { title: 'Status', key: 'status', width: 120, render: (_, record) => <Tag color={record.isActive ? 'green' : 'default'}>{record.isActive ? 'Active' : 'Inactive'}</Tag> },
            { title: 'Action', key: 'action', width: 120, render: (_, record) => <Button onClick={() => openEditModal(record)}>Edit</Button> },
          ]}
        />
      ) : (
        <Empty description="Select a doctor to inspect schedules" />
      )}

      <Modal
        title={editingSchedule ? 'Update schedule' : `Create schedule${selectedDoctorLabel ? ` for ${selectedDoctorLabel.user?.name}` : ''}`}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingSchedule ? 'Update' : 'Create'}
        confirmLoading={isSaving}
        width={980}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item label="Doctor" name="doctor" rules={[{ required: true, message: 'Doctor is required' }]}>
              <Select options={doctors.map((doctor) => ({ value: doctor.id || doctor._id, label: `${doctor.user?.name} - ${doctor.specialization}` }))} />
            </Form.Item>
            <Form.Item label="Timezone" name="timezone" rules={[{ required: true, message: 'Timezone is required' }]}>
              <Select options={timezoneOptions} />
            </Form.Item>
            <Form.Item label="Slot duration (minutes)" name="slotDurationMinutes" rules={[{ required: true, message: 'Slot duration is required' }]}>
              <InputNumber className="!w-full" min={5} max={180} />
            </Form.Item>
            <Form.Item label="Active status" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Effective from" name="effectiveFrom" rules={[{ required: true, message: 'effectiveFrom is required' }] }>
              <DatePicker className="!w-full" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item label="Effective to" name="effectiveTo">
              <DatePicker className="!w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </div>

          <div className="mt-4 grid gap-4">
            <Title level={5} className="!mb-0">Working days</Title>
            <Form.List name="workingDays">
              {(fields) => (
                <div className="grid gap-4">
                  {fields.map((field, index) => (
                    <Card key={field.key} size="small" className="rounded-2xl border border-slate-200">
                      <div className="grid gap-4">
                        <Form.Item name={[field.name, 'dayOfWeek']} hidden>
                          <InputNumber />
                        </Form.Item>
                        <div className="grid gap-4 md:grid-cols-[140px_120px_1fr_1fr] md:items-center">
                          <div className="font-medium text-slate-900">{dayLabels[index]}</div>
                          <Form.Item label="Working" name={[field.name, 'isWorking']} valuePropName="checked" className="!mb-0">
                            <Switch />
                          </Form.Item>
                          <Form.Item label="Start" name={[field.name, 'sessions', 0, 'startTime']} className="!mb-0">
                            <TimePicker className="!w-full" format="HH:mm" minuteStep={5} />
                          </Form.Item>
                          <Form.Item label="End" name={[field.name, 'sessions', 0, 'endTime']} className="!mb-0">
                            <TimePicker className="!w-full" format="HH:mm" minuteStep={5} />
                          </Form.Item>
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-200 p-4">
                          <div className="mb-3 text-sm font-medium text-slate-700">Breaks</div>
                          <Form.List name={[field.name, 'sessions', 0, 'breaks']}>
                            {(breakFields, breakOperations) => (
                              <div className="grid gap-3">
                                {breakFields.map((breakField) => (
                                  <div key={breakField.key} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                                    <Form.Item label="Break start" name={[breakField.name, 'startTime']} className="!mb-0">
                                      <TimePicker className="!w-full" format="HH:mm" minuteStep={5} />
                                    </Form.Item>
                                    <Form.Item label="Break end" name={[breakField.name, 'endTime']} className="!mb-0">
                                      <TimePicker className="!w-full" format="HH:mm" minuteStep={5} />
                                    </Form.Item>
                                    <Button danger onClick={() => breakOperations.remove(breakField.name)}>
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                <Button type="dashed" onClick={() => breakOperations.add({ startTime: null, endTime: null })}>
                                  Add Break
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Form.List>
          </div>
        </Form>
      </Modal>
    </Card>
  )
}

export default SchedulesPage
