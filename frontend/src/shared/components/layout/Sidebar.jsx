import { NavLink } from 'react-router-dom'
import useAuthStore from '../../../features/auth/store/authStore'

const navItems = [
  { label: '🏠 Dashboard', path: '/dashboard' },
  { label: '🍽️ Restaurantes', path: '/restaurants' },
  { label: '🏷️ Categorías', path: '/categories' },
  { label: '🪑 Mesas', path: '/tables' },
  { label: '📋 Menús', path: '/menus' },
  { label: '📦 Inventario', path: '/inventory' },
  { label: '🛒 Pedidos', path: '/orders' },
  { label: '📅 Reservaciones', path: '/reservations' },
  { label: '🎉 Eventos', path: '/events' },
  { label: '📊 Reportes', path: '/reports' },
  { label: '👥 Usuarios', path: '/users' },
]

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout)

  return (
    <aside className="w-64 bg-zinc-900 min-h-screen flex flex-col border-r border-zinc-800">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 flex items-center justify-center text-sm">
            🍽️
          </div>
          <span className="text-white font-bold text-lg tracking-wide">
            GastroManager
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-yellow-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={logout}
          className="w-full text-left px-4 py-2.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-xl text-sm transition-all"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar