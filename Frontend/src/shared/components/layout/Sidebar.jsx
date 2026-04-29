import { NavLink } from 'react-router-dom'
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
  LogOut 
} from 'lucide-react'
import useAuthStore from '../../../features/auth/store/authStore'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Restaurantes', path: '/restaurants', icon: Utensils },
  { label: 'Categorías', path: '/categories', icon: Tag },
    { label: 'Productos', path: '/products', icon: ShoppingBag },
  { label: 'Mesas', path: '/tables', icon: Armchair },
  { label: 'Menús', path: '/menus', icon: ClipboardList },
  { label: 'Inventario', path: '/inventory', icon: Package },
  { label: 'Pedidos', path: '/orders', icon: ShoppingCart },
  { label: 'Reservaciones', path: '/reservations', icon: CalendarDays },
  { label: 'Eventos', path: '/events', icon: PartyPopper },
  { label: 'Reportes', path: '/reports', icon: BarChart3 },
  { label: 'Usuarios', path: '/users', icon: Users },
]

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout)

  return (
    <aside className="w-64 bg-zinc-950 min-h-screen flex flex-col border-r border-zinc-800">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Utensils size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">
            GastroManager
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all group ${
                  isActive
                    ? 'bg-orange-500 text-white font-semibold shadow-lg shadow-orange-500/20'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`
              }
            >
              <Icon size={18} className={`${({ isActive }) => isActive ? 'text-white' : 'group-hover:text-white transition-colors'}`} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-xl text-sm transition-all group"
        >
          <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar