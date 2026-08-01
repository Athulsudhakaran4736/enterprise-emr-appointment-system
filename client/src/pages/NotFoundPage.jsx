import { Button, Result } from 'antd'
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <Result
        status="404"
        title="Page not found"
        subTitle="The route you requested does not exist in the current frontend build."
        extra={<Button type="primary"><Link to="/admin/dashboard">Go to dashboard</Link></Button>}
      />
    </div>
  )
}

export default NotFoundPage
