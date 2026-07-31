import { Alert, Card, Descriptions, Result, Spin, Tag, Timeline, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMyAppointmentById } from '../../services/doctor.js'
import { appointmentStatusColors, formatStatusLabel, formatTimeRange } from './doctor-utils.js'

const { Title, Paragraph } = Typography

function DoctorAppointmentDetailsPage() {
  const { appointmentId } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAppointment = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getMyAppointmentById(appointmentId)
        setAppointment(result)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointment()
  }, [appointmentId])

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!appointment && !error) {
    return <Result status="404" title="Appointment not found" subTitle="No appointment record is available for this route." />
  }

  return (
    <div className="space-y-6">
      {error ? <Alert type="error" message={error} showIcon /> : null}

      {appointment ? (
        <>
          <Card className="rounded-[28px] border-0 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Title level={3} className="!mb-2">Appointment Details</Title>
                <Paragraph className="!mb-0 !text-slate-500">
                  Full visit context for the selected patient appointment.
                </Paragraph>
              </div>
              <Tag color={appointmentStatusColors[appointment.status] || 'default'} className="!w-fit !rounded-full !px-4 !py-1">
                {formatStatusLabel(appointment.status)}
              </Tag>
            </div>

            <Descriptions bordered column={1} size="middle" className="mb-6">
              <Descriptions.Item label="Patient">{appointment.patient?.name || 'Unknown patient'}</Descriptions.Item>
              <Descriptions.Item label="Patient number">{appointment.patient?.patientNumber || 'Unavailable'}</Descriptions.Item>
              <Descriptions.Item label="Department">{appointment.department?.name || 'Unavailable'}</Descriptions.Item>
              <Descriptions.Item label="Date">{appointment.appointmentDate}</Descriptions.Item>
              <Descriptions.Item label="Time">{formatTimeRange(appointment.startTime, appointment.endTime)}</Descriptions.Item>
              <Descriptions.Item label="Reason for visit">{appointment.reasonForVisit || 'Not specified'}</Descriptions.Item>
              <Descriptions.Item label="Notes">{appointment.notes || 'No clinical notes recorded.'}</Descriptions.Item>
              <Descriptions.Item label="Patient mobile">{appointment.patient?.mobile || 'Unavailable'}</Descriptions.Item>
              <Descriptions.Item label="Patient email">{appointment.patient?.email || 'Unavailable'}</Descriptions.Item>
              <Descriptions.Item label="Patient address">{appointment.patient?.address || 'Unavailable'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="rounded-[28px] border-0 shadow-sm" title="Status timeline">
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: `Created${appointment.createdAt ? ` • ${appointment.createdAt}` : ''}`,
                },
                appointment.arrivedAt
                  ? {
                      color: 'gold',
                      children: `Arrived • ${appointment.arrivedAt}`,
                    }
                  : null,
                appointment.completedAt
                  ? {
                      color: 'green',
                      children: `Completed • ${appointment.completedAt}`,
                    }
                  : null,
                appointment.cancelledAt
                  ? {
                      color: 'red',
                      children: `Cancelled • ${appointment.cancelledAt}`,
                    }
                  : null,
              ].filter(Boolean)}
            />
          </Card>
        </>
      ) : null}
    </div>
  )
}

export default DoctorAppointmentDetailsPage
