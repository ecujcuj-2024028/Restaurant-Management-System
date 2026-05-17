import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Utensils,
  Tag,
  ShoppingBag,
  Armchair,
  ClipboardList,
  Package,
  ShoppingCart,
  CalendarDays,
  PartyPopper,
  BarChart3,
  Users,
  LogOut,
  X,
  User,
  Truck,
} from "lucide-react";
import useAuthStore from "../../../features/auth/store/authStore";

// Constantes de roles (deben coincidir con el backend)
const ROLES = {
  ADMIN_SISTEMA: "ADMIN_SISTEMA",
  ADMIN_RESTAURANTE: "ADMIN_RESTAURANTE",
  CLIENTE: "CLIENTE",
};

/**
 * Definición de todos los items de navegación con sus roles permitidos.
 * El campo `roles` lista qué roles pueden ver ese link.
 * Si `roles` está vacío o ausente, todos los roles autenticados pueden verlo.
 */
const NAV_ITEMS = [
  {
    label: "Página Principal",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: [], // Visible para todos
  },

  // ── ADMIN_SISTEMA únicamente ──
  {
    label: "Usuarios",
    path: "/users",
    icon: Users,
    roles: [ROLES.ADMIN_SISTEMA],
  },
  {
    label: "Categorías",
    path: "/categories",
    icon: Tag,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },
  {
    label: "Productos",
    path: "/products",
    icon: ShoppingBag,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },
  {
    label: "Mesas",
    path: "/tables",
    icon: Armchair,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },
  {
    label: "Reportes",
    path: "/reports",
    icon: BarChart3,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },

  // ── Todos pueden ver el catálogo ──
  {
    label: "Restaurantes",
    path: "/restaurants",
    icon: Utensils,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE, ROLES.CLIENTE],
  },
  {
    label: "Menús",
    path: "/menus",
    icon: ClipboardList,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },
  {
    label: "Pedidos",
    path: "/orders",
    icon: ShoppingCart,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },
  {
    label: "Pedidos Externos",
    path: "/external-orders",
    icon: Truck,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },
  {
    label: "Inventario",
    path: "/inventory",
    icon: Package,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },
  {
    label: "Reservaciones",
    path: "/reservations",
    icon: CalendarDays,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },
  {
    label: "Eventos",
    path: "/events",
    icon: PartyPopper,
    roles: [ROLES.ADMIN_SISTEMA, ROLES.ADMIN_RESTAURANTE],
  },

  // ── CLIENTE únicamente ──
  {
    label: "Mis Pedidos",
    path: "/my-orders",
    icon: ShoppingCart,
    roles: [ROLES.CLIENTE],
  },
  {
    label: "Mis Reservaciones",
    path: "/my-reservations",
    icon: CalendarDays,
    roles: [ROLES.CLIENTE],
  },
  {
    label: "Mi Perfil",
    path: "/profile",
    icon: User,
    roles: [],
  },
];

/**
 * Filtra los items de navegación según el rol del usuario.
 * Los items con `roles: []` son visibles para todos.
 */
const getNavItemsForRole = (userRoles) =>
  NAV_ITEMS.filter(
    (item) =>
      item.roles.length === 0 || item.roles.some((r) => userRoles.includes(r)),
  );

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuthStore();
  const userRoles = user?.roles || [];
  const visibleItems = getNavItemsForRole(userRoles);

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 flex flex-col border-r border-zinc-800 transition-transform duration-300 transform
        lg:relative lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Utensils size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">
            GastroManager
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-zinc-500 hover:text-white lg:hidden transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {userRoles.length > 0 && (
        <div className="px-6 py-3 border-b border-zinc-800">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 uppercase tracking-wider">
            {userRoles[0].replace("_", " ")}
          </span>
        </div>
      )}

      {/* Navegación filtrada por rol */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all group ${
                  isActive
                    ? "bg-orange-500 text-white font-semibold shadow-lg shadow-orange-500/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-xl text-sm transition-all group"
        >
          <LogOut
            size={18}
            className="group-hover:text-red-400 transition-colors"
          />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
