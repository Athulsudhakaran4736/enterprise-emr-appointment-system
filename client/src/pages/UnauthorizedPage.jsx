import { Button, Result } from 'antd'
import { Link } from 'react-router-dom'

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <Result
        status="403"
        title="Access denied"
        subTitle="Your current role is not allowed to access this route."
        extra={<Button type="primary"><Link to="/login">Return to login</Link></Button>}
      />
    </div>
  )
}

export default UnauthorizedPage
