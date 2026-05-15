import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../../features/auth/store/authStore";
import AuthPage from "../../features/auth/pages/AuthPage";
import DashboardPage from "../layouts/DashboardPage";
import UserList from "../../features/users/components/UserList";
import RestaurantList from "../../features/restaurants/components/RestaurantList";
import RestaurantDetail from "../../features/restaurants/components/RestaurantDetail";
import CategoryList from "../../features/categories/components/CategoryList";
import Dashboard from "../../features/dashboard/components/Dashboard";
import ProductList from "../../features/product/components/ProductList";
import InventoryList from "../../features/inventory/components/InventoryList";
import TableList from "../../features/tables/components/TableList";
import ReservationList from "../../features/reservations/components/ReservationList";
import MyReservations from "../../features/reservations/components/MyReservations";
import ExternalOrderList from "../../features/external-orders/components/ExternalOrderList";
import UserProfile from "../../features/users/components/UserProfile";
import NotFound from "../../shared/components/ui/NotFound";
import RoleRoute from "../../shared/components/RoleRoute";
import OrderList from "../../features/orders/components/OrderList";
import ReportsPage from "../../features/reports/components/ReportsPage";
import MyOrders from '../../features/orders/components/MyOrders'
import EventList from '../../features/events/components/EventList'
import MenuList from '../../features/menu/components/MenuList';

// Roles disponibles en el sistema
const ROLES = {
  ADMIN_SISTEMA: "ADMIN_SISTEMA",
  ADMIN_RESTAURANTE: "ADMIN_RESTAURANTE",
  CLIENTE: "CLIENTE",
};

// Roles con acceso de administración (sistema + restaurante)
const ADMIN_ROLES = [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE];

// Protege rutas que requieren autenticación (cualquier rol)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

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
          {/* Redirección raíz */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* ── Accesible por todos los roles autenticados ── */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* ── Solo ADMIN_SISTEMA ── */}
          <Route
            path="users"
            element={
              <RoleRoute roles={ROLES.ADMIN_SISTEMA}>
                <UserList />
              </RoleRoute>
            }
          />
          <Route
            path="categories"
            element={
              <RoleRoute roles={ROLES.ADMIN_SISTEMA}>
                <CategoryList />
              </RoleRoute>
            }
          />
          <Route
            path="tables"
            element={
              <RoleRoute roles={ROLES.ADMIN_SISTEMA}>
                <TableList />
              </RoleRoute>
            }
          />
          <Route
            path="products"
            element={
              <RoleRoute roles={ROLES.ADMIN_SISTEMA}>
                <ProductList />
              </RoleRoute>
            }
          />
          <Route
            path="reports"
            element={
              <RoleRoute roles={ADMIN_ROLES}>
                <ReportsPage />
              </RoleRoute>
            }
          />

          {/* ── Todos los roles pueden ver restaurantes (con vistas distintas) ── */}
          <Route
            path="restaurants"
            element={
              <RoleRoute roles={[...ADMIN_ROLES, ROLES.CLIENTE]}>
                <RestaurantList />
              </RoleRoute>
            }
          />
          <Route
            path="restaurants/:id"
            element={
              <RoleRoute roles={[...ADMIN_ROLES, ROLES.CLIENTE]}>
                <RestaurantDetail />
              </RoleRoute>
            }
          />
          <Route
            path="menus"
            element={
              <RoleRoute roles={ADMIN_ROLES}>
                <MenuList/>
              </RoleRoute>
            }
          />
          <Route
            path="orders"
            element={
              <RoleRoute roles={ADMIN_ROLES}>
                <OrderList />
              </RoleRoute>
            }
          />
          <Route
            path="external-orders"
            element={
              <RoleRoute roles={ADMIN_ROLES}>
                <ExternalOrderList />
              </RoleRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <RoleRoute roles={ADMIN_ROLES}>
                <InventoryList />
              </RoleRoute>
            }
          />
          <Route
            path="reservations"
            element={
              <RoleRoute roles={ADMIN_ROLES}>
                <ReservationList />
              </RoleRoute>
            }
          />
          <Route
            path="events"
            element={
              <RoleRoute roles={ADMIN_ROLES}>
                <EventList />
              </RoleRoute>
            }
          />

          {/* ── CLIENTE ── */}
          <Route
              path="my-orders"
              element={
                <RoleRoute roles={ROLES.CLIENTE}>
                  <MyOrders />
                </RoleRoute>
              }
            />
          <Route
            path="my-reservations"
            element={
              <RoleRoute roles={ROLES.CLIENTE}>
                <MyReservations />
              </RoleRoute>
            }
          />
          <Route
            path="profile"
            element={
              <RoleRoute roles={Object.values(ROLES)}>
                <UserProfile />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;