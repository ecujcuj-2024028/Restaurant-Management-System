import { NavLink } from "react-router-dom";
import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
 
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../../../features/auth/store/authStore";
 
// Roles
const ROLES = {
  ADMIN_SISTEMA: "ADMIN_SISTEMA",
  ADMIN_RESTAURANTE: "ADMIN_RESTAURANTE",
  CLIENTE: "CLIENTE",
};
 
// Items del menú
const NAV_ITEMS = [
  {
    label: "Página Principal",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: [],
  },
 
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
 
  {
    label: "Restaurantes",
    path: "/restaurants",
    icon: Utensils,
    roles: [
      ROLES.ADMIN_SISTEMA,
      ROLES.ADMIN_RESTAURANTE,
      ROLES.CLIENTE,
    ],
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
    roles: [
      ROLES.ADMIN_SISTEMA,
      ROLES.ADMIN_RESTAURANTE,
      ROLES.CLIENTE,
    ],
  },
 
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
 
// Filtrar según roles
const getNavItemsForRole = (userRoles) =>
  NAV_ITEMS.filter(
    (item) =>
      item.roles.length === 0 ||
      item.roles.some((r) => userRoles.includes(r))
  );
 
// Item individual
const NavItem = ({ item, collapsed, onClose }) => {
  const Icon = item.icon;
 
  return (
    <div className="relative group/item">
      <NavLink
        to={item.path}
        onClick={() => {
          if (window.innerWidth < 1024) onClose();
        }}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
            collapsed ? "justify-center" : ""
          } ${
            isActive
              ? "bg-orange-500 text-white font-semibold shadow-lg shadow-orange-500/20"
              : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
          }`
        }
      >
        <Icon size={18} className="shrink-0" />
 
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </NavLink>
 
      {/* Tooltip cuando está colapsado */}
      {collapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
          <div className="bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
            {item.label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-800" />
          </div>
        </div>
      )}
    </div>
  );
};
 
const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuthStore();
 
  const userRoles = user?.roles || [];
  const visibleItems = getNavItemsForRole(userRoles);
 
  const [collapsed, setCollapsed] = useState(false);
 
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`
        fixed inset-y-0 left-0 z-50 bg-zinc-950 flex flex-col border-r border-zinc-800
        lg:relative lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Header */}
      <div
        className={`p-4 border-b border-zinc-800 flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                <Utensils size={16} className="text-white" />
              </div>
 
              <span className="text-white font-bold text-base tracking-wide whitespace-nowrap">
                GastroManager
              </span>
            </motion.div>
          )}
 
          {collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center"
            >
              <Utensils size={16} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
 
        {!collapsed && (
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white lg:hidden transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
 
      {/* Info usuario */}
      {userRoles.length > 0 && !collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="px-4 py-3 border-b border-zinc-800 flex flex-col gap-2"
        >
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 uppercase tracking-widest border border-orange-500/20 w-fit">
            {userRoles[0].replace(/_/g, " ")}
          </span>
 
          <div className="space-y-1">
            <p className="text-zinc-300 text-xs font-medium truncate">
              {user?.name || user?.username || "Usuario"}
            </p>
 
            <p className="text-zinc-500 text-[10px] truncate">
              {user?.email}
            </p>
 
            <p className="text-zinc-600 text-[9px] font-mono uppercase tracking-wider">
              ID: {user?.id || user?._id || "N/A"}
            </p>
          </div>
        </motion.div>
      )}
 
      {/* Botón contraer */}
      <div className="p-3 border-b border-zinc-800 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-zinc-600 hover:text-white hover:bg-zinc-800/80 rounded-xl text-sm transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
 
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden text-xs"
              >
                Contraer menú
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
 
      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            onClose={onClose}
          />
        ))}
      </nav>
 
      {/* Logout */}
      <div className="p-3 border-t border-zinc-800">
        <div className="relative group/logout">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-sm transition-all ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={18} className="shrink-0" />
 
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Cerrar sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
 
          {/* Tooltip logout */}
          {collapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/logout:opacity-100 transition-opacity duration-150">
              <div className="bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                Cerrar sesión
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-800" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
 
export default Sidebar;
 