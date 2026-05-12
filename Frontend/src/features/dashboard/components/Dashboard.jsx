import useAuthStore from '../../auth/store/authStore'
import AdminDashboard from './AdminDashboard'
import ClientDashboard from './ClientDashboard'

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  
  // Roles de administración
  const isAdmin = user?.roles?.some(role => 
    role === 'ADMIN_SISTEMA' || role === 'ADMIN_RESTAURANTE'
  )

  if (isAdmin) {
    return <AdminDashboard />
  }

  return <ClientDashboard />
}

export default Dashboard
