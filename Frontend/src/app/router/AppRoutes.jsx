import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '../../features/auth/store/authStore'
import AuthPage from '../../features/auth/pages/AuthPage'
import DashboardPage from '../layouts/DashboardPage'
import UserList from '../../features/users/components/UserList'
import RestaurantList from '../../features/restaurants/components/RestaurantList'
import CategoryList from '../../features/categories/components/CategoryList'
import Dashboard from '../../features/dashboard/components/Dashboard'
import ProductList from '../../features/product/components/ProductList'
import TableList from '../../features/tables/components/TableList'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="restaurants" element={<RestaurantList />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="tables" element={<TableList />} />
          <Route path="menus" element={<div className="text-white">Menús (próximamente)</div>} />
          <Route path="inventory" element={<div className="text-white">Inventario (próximamente)</div>} />
          <Route path="orders" element={<div className="text-white">Pedidos (próximamente)</div>} />
          <Route path="reservations" element={<div className="text-white">Reservaciones (próximamente)</div>} />
          <Route path="events" element={<div className="text-white">Eventos (próximamente)</div>} />
          <Route path="reports" element={<div className="text-white">Reportes (próximamente)</div>} />
          <Route path="users" element={<UserList />} />
          <Route path="products" element={<ProductList />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes