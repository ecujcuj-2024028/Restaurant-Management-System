import useAuthStore from '../../auth/store/authStore'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const cards = [
    { label: 'Restaurantes', value: '—', icon: '🍽️', color: 'yellow' },
    { label: 'Pedidos activos', value: '—', icon: '🛒', color: 'yellow' },
    { label: 'Reservaciones hoy', value: '—', icon: '📅', color: 'yellow' },
    { label: 'Productos en stock bajo', value: '—', icon: '📦', color: 'red' },
  ]

  const quickAccess = [
    { label: 'Restaurantes', icon: '🍽️', path: '/restaurants' },
    { label: 'Pedidos', icon: '🛒', path: '/orders' },
    { label: 'Inventario', icon: '📦', path: '/inventory' },
    { label: 'Reportes', icon: '📊', path: '/reports' },
  ]

  const activity = [
    'Sistema iniciado correctamente',
    'Root Admin autenticado',
    'Base de datos conectada',
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Bienvenido, {user?.username || 'Admin'} 👋
        </h1>
        <p className="text-zinc-500 text-sm">Aquí tienes un resumen de tu sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${card.color === 'red' ? 'bg-red-500 bg-opacity-20 text-red-400' : 'bg-yellow-500 bg-opacity-20 text-yellow-400'}`}>
                {card.color === 'red' ? 'Alerta' : 'Total'}
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-zinc-500 text-sm">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Actividad reciente</h3>
          <div className="space-y-3">
            {activity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-zinc-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Accesos rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickAccess.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl px-4 py-3 transition-colors"
              >
                <span>{item.icon}</span>
                <span className="text-zinc-300 text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard