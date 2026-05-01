import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Utensils, Package, ShoppingCart, Users } from 'lucide-react'

const MobileTabBar = () => {
  const items = [
    { label: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Rest.', path: '/restaurants', icon: Utensils },
    { label: 'Stock', path: '/inventory', icon: Package },
    { label: 'Pedidos', path: '/orders', icon: ShoppingCart },
    { label: 'Perfil', path: '/users', icon: Users },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 pb-safe">
      <nav className="flex items-center justify-around px-2 py-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 min-w-[64px] transition-all ${
                  isActive ? 'text-orange-500 scale-110' : 'text-zinc-500'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export default MobileTabBar
