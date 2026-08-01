import { Alert, Card, Descriptions, Spin, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { getMyDoctorProfile } from '../../services/doctor.js'

const { Title, Paragraph } = Typography

function DoctorProfilePage() {
  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      setError('')

      try {
        const result = await getMyDoctorProfile(user)
        setDoctor(result)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-2">My Profile</Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Read-only account and professional details for the current doctor profile.
          </Paragraph>
        </div>
        <Tag color={doctor?.isActive && doctor?.user?.isActive ? 'green' : 'default'} className="!rounded-full !px-4 !py-1">
          {doctor?.isActive && doctor?.user?.isActive ? 'Active' : 'Inactive'}
        </Tag>
      </div>

      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="Name">{doctor?.user?.name || user?.name}</Descriptions.Item>
        <Descriptions.Item label="Email">{doctor?.user?.email || user?.email}</Descriptions.Item>
        <Descriptions.Item label="Department">{doctor?.department?.name || 'Unavailable'}</Descriptions.Item>
        <Descriptions.Item label="Specialization">{doctor?.specialization || 'Unavailable'}</Descriptions.Item>
        <Descriptions.Item label="Registration number">{doctor?.registrationNumber || 'Unavailable'}</Descriptions.Item>
        <Descriptions.Item label="Qualification">{doctor?.qualification || 'Unavailable'}</Descriptions.Item>
        <Descriptions.Item label="Consultation duration">{doctor?.consultationDuration || 'Unavailable'} minutes</Descriptions.Item>
        <Descriptions.Item label="Role">{doctor?.user?.role || user?.role}</Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

export default DoctorProfilePage
