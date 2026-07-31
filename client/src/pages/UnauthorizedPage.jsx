import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function UnauthorizedPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleReturnToLogin = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <Result
        status="403"
        title="Access denied"
        subTitle="Your current role is not allowed to access this route."
        extra={
          <Button type="primary" onClick={handleReturnToLogin}>
            Return to login
          </Button>
        }
      />
    </div>
  )
}

export default UnauthorizedPage
