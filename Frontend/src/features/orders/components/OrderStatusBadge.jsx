const STATUS_CONFIG = {
  recibido: { label: 'Recibido', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  en_preparacion: { label: 'En preparación', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  listo: { label: 'Listo', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  entregado: { label: 'Entregado', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const OrderStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.recibido

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}

export default OrderStatusBadge