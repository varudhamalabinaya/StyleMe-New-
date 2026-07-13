import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useWizard } from '../context/useWizard'
import { paths } from './paths'

export function RequireGuest() {
  const { authMode } = useWizard()
  const location = useLocation()

  if (authMode !== 'guest') {
    return <Navigate to={paths.splash} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
