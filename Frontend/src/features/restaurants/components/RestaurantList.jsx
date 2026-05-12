import useAuthStore from '../../auth/store/authStore'
import AdminRestaurantList from './AdminRestaurantList'
import ClientRestaurantGrid from './ClientRestaurantGrid'

const RestaurantList = () => {
  const user = useAuthStore((state) => state.user)
  
  // Roles de administración
  const isAdmin = user?.roles?.some(role => 
    role === 'ADMIN_SISTEMA' || role === 'ADMIN_RESTAURANTE'
  )

  if (isAdmin) {
    return <AdminRestaurantList />
  }

  // Para el cliente, mostramos únicamente la cuadrícula de restaurantes
  return <ClientRestaurantGrid />
}

export default RestaurantList
