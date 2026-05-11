import { Navigate } from 'react-router-dom'
import useAuthStore from '../../features/auth/store/authStore'

const RoleRoute = ({ roles, redirectTo = '/dashboard', children }) => {
  const { user, isAuthenticated } = useAuthStore()

  console.log('RoleRoute debug:', {
    roles,
    userRoles: user?.roles,
    isAuthenticated,
    hasAccess: Array.isArray(roles)
      ? roles.some(r => user?.roles?.includes(r))
      : user?.roles?.includes(roles)
  })

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  const userRoles = user.roles || []

  const hasAccess = allowedRoles.some((role) => userRoles.includes(role))

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default RoleRoute