import { Navigate, Outlet } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../context/useAuth.js'

function PublicRoute() {
  const { isAuthenticated, isBootstrapping, user, getHomeRouteForRole } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spin size="large" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={getHomeRouteForRole(user?.role)} replace />
  }

  return <Outlet />
}

export default PublicRoute

