import { Alert, Card, Empty, List, Spin, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { getMyDoctorSchedules } from '../../services/doctor.js'
import { getScheduleSummary, weekdayLabels } from './doctor-utils.js'

const { Title, Paragraph, Text } = Typography

function DoctorSchedulePage() {
  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSchedules = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getMyDoctorSchedules(user)
        setDoctor(result.doctor)
        setSchedules(result.items)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadSchedules()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error ? <Alert type="error" message={error} showIcon /> : null}

      <Card className="rounded-[28px] border-0 shadow-sm">
        <Title level={3} className="!mb-2">My Schedule</Title>
        <Paragraph className="!mb-0 !text-slate-500">
          Read-only view of the schedule assigned to {doctor?.user?.name || user?.name}.
        </Paragraph>
      </Card>

      {!schedules.length ? (
        <Card className="rounded-[28px] border-0 shadow-sm">
          <Empty description="No schedule has been assigned yet." />
        </Card>
      ) : (
        <div className="grid gap-6">
          {schedules.map((schedule) => {
            const workingDays = getScheduleSummary(schedule.workingDays)

            return (
              <Card
                key={schedule.id || schedule._id}
                className="rounded-[28px] border-0 shadow-sm"
                title={
                  <div className="flex flex-wrap items-center gap-3">
                    <span>{schedule.effectiveFrom} to {schedule.effectiveTo || 'Open ended'}</span>
                    <Tag color={schedule.isActive ? 'green' : 'default'}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                  </div>
                }
              >
                <div className="mb-5 grid gap-4 md:grid-cols-3">
                  <div>
                    <Text className="!text-slate-500">Timezone</Text>
                    <div className="font-semibold text-slate-900">{schedule.timezone}</div>
                  </div>
                  <div>
                    <Text className="!text-slate-500">Slot duration</Text>
                    <div className="font-semibold text-slate-900">{schedule.slotDurationMinutes} minutes</div>
                  </div>
                  <div>
                    <Text className="!text-slate-500">Working days</Text>
                    <div className="font-semibold text-slate-900">{workingDays.length}</div>
                  </div>
                </div>

                <List
                  dataSource={weekdayLabels.map((label, index) => {
                    const day = workingDays.find((item) => item.dayOfWeek === index)
                    return { label, day }
                  })}
                  renderItem={({ label, day }) => (
                    <List.Item>
                      <List.Item.Meta
                        title={label}
                        description={
                          day
                            ? day.sessions.length
                              ? day.sessions
                                  .map((session) => {
                                    const breaks = session.breaks?.length
                                      ? ` | Breaks: ${session.breaks
                                          .map((currentBreak) => `${currentBreak.startTime}-${currentBreak.endTime}`)
                                          .join(', ')}`
                                      : ''

                                    return `${session.startTime}-${session.endTime}${breaks}`
                                  })
                                  .join(' • ')
                              : 'Marked as working with no session blocks configured'
                            : 'Not working'
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DoctorSchedulePage
