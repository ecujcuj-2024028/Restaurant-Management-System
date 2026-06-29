import { useEffect, useState } from 'react'
import {
    Bell,
    CheckCheck,
    Trash2,
    Package,
    ShoppingCart,
    AlertTriangle,
    Info,
    Clock,
    CalendarCheck,
    Filter,
    Search,
    RefreshCw,
} from 'lucide-react'
import useNotificationStore from '../store/notificationStore'
import { formatRelativeTime } from '../../../shared/utils/date-utils'

// ── Tipos de notificación disponibles ───────────────────────────────────────
const FILTER_OPTIONS = [
    { value: 'all', label: 'Todas' },
    { value: 'order', label: 'Pedidos' },
    { value: 'inventory', label: 'Inventario' },
    { value: 'reservation', label: 'Reservaciones' },
    { value: 'warning', label: 'Alertas' },
    { value: 'info', label: 'Información' },
]

// ── Icono según tipo ─────────────────────────────────────────────────────────
const getIcon = (type) => {
    switch (type) {
        case 'inventory': return <Package size={18} className="text-amber-500" />
        case 'order': return <ShoppingCart size={18} className="text-blue-500" />
        case 'warning': return <AlertTriangle size={18} className="text-red-500" />
        case 'reservation': return <CalendarCheck size={18} className="text-emerald-500" />
        default: return <Info size={18} className="text-orange-500" />
    }
}

// ── Badge de color según tipo ────────────────────────────────────────────────
const getTypeBadge = (type) => {
    const map = {
        order: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        inventory: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        warning: 'bg-red-500/10 text-red-400 border-red-500/20',
        reservation: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        info: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    }
    const labels = {
        order: 'Pedido', inventory: 'Inventario', warning: 'Alerta',
        reservation: 'Reservación', info: 'Info',
    }
    const cls = map[type] || map.info
    return (
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>
            {labels[type] || 'Info'}
        </span>
    )
}

// ── Fila individual ──────────────────────────────────────────────────────────
const NotificationRow = ({ notif, onRead, onDelete }) => (
    <div
        className={`
      group flex gap-4 px-6 py-5 border-b border-zinc-800/50 last:border-0
      transition-colors hover:bg-zinc-800/30 relative
      ${!notif.isRead ? 'bg-orange-500/5' : ''}
    `}
    >
        {/* Indicador no leída */}
        {!notif.isRead && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-10 bg-orange-500 rounded-full" />
        )}

        {/* Icono */}
        <div
            className={`
        mt-0.5 w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
        ${!notif.isRead ? 'bg-zinc-800 shadow-lg' : 'bg-zinc-800/30'}
      `}
        >
            {getIcon(notif.type)}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-2 justify-between">
                <p className={`text-sm font-bold ${!notif.isRead ? 'text-white' : 'text-zinc-400'}`}>
                    {notif.title}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {getTypeBadge(notif.type)}
                    <button
                        onClick={() => onDelete(notif._id)}
                        title="Eliminar notificación"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 transition-all rounded-lg hover:bg-red-500/10"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <p className={`text-xs mt-1 leading-relaxed ${!notif.isRead ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {notif.message}
            </p>

            <div className="flex items-center gap-3 mt-2.5">
                <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-zinc-600" />
                    <span className="text-[10px] text-zinc-500 font-medium">
                        {formatRelativeTime(notif.createdAt)}
                    </span>
                </div>
                {!notif.isRead && (
                    <button
                        onClick={() => onRead(notif._id)}
                        className="text-[10px] text-orange-500 font-bold hover:underline"
                    >
                        Marcar como leída
                    </button>
                )}
            </div>
        </div>
    </div>
)

// ── Estado vacío ─────────────────────────────────────────────────────────────
const EmptyState = ({ filtered }) => (
    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
        <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-5">
            <Bell size={32} className="text-zinc-600" />
        </div>
        <p className="text-white font-bold text-lg">
            {filtered ? 'Sin resultados' : 'Todo al día'}
        </p>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs">
            {filtered
                ? 'No hay notificaciones que coincidan con tu búsqueda o filtro.'
                : 'No tienes notificaciones pendientes por ahora.'}
        </p>
    </div>
)

// ── Página principal ─────────────────────────────────────────────────────────
const NotificationsPage = () => {
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllRead,
        removeNotification,
    } = useNotificationStore()

    const [filterType, setFilterType] = useState('all')
    const [showUnread, setShowUnread] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    // ── Filtrado local ─────────────────────────────────────────────────────────
    const filtered = notifications.filter((n) => {
        const matchesType = filterType === 'all' || n.type === filterType
        const matchesUnread = !showUnread || !n.isRead
        const matchesSearch = !search ||
            n.title?.toLowerCase().includes(search.toLowerCase()) ||
            n.message?.toLowerCase().includes(search.toLowerCase())
        return matchesType && matchesUnread && matchesSearch
    })

    const isFiltered = filterType !== 'all' || showUnread || search.trim() !== ''

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* ── Cabecera ────────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Bell size={20} className="text-orange-500" />
                        </div>
                        Notificaciones
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {unreadCount > 0
                            ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                            : 'Estás al día con todas tus notificaciones'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchNotifications()}
                        title="Actualizar"
                        className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl text-sm font-semibold transition-all"
                        >
                            <CheckCheck size={15} />
                            Marcar todas como leídas
                        </button>
                    )}
                </div>
            </div>

            {/* ── Controles de filtro ──────────────────────────────────────────────── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">

                {/* Búsqueda */}
                <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar en notificaciones..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                    />
                </div>

                {/* Filtros de tipo + toggle no leídas */}
                <div className="flex flex-wrap items-center gap-2">
                    <Filter size={13} className="text-zinc-600 hidden sm:block" />
                    {FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilterType(opt.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterType === opt.value
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700/60'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}

                    <button
                        onClick={() => setShowUnread(!showUnread)}
                        className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${showUnread
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                    >
                        Solo no leídas
                    </button>
                </div>
            </div>

            {/* ── Lista ───────────────────────────────────────────────────────────── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

                {/* Conteo */}
                <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <span className="text-xs text-zinc-500 font-medium">
                        {filtered.length} {filtered.length === 1 ? 'notificación' : 'notificaciones'}
                        {isFiltered ? ' encontradas' : ' en total'}
                    </span>
                    {isFiltered && (
                        <button
                            onClick={() => { setFilterType('all'); setShowUnread(false); setSearch('') }}
                            className="text-[10px] text-orange-500 hover:underline font-bold uppercase tracking-widest"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Items */}
                {loading && notifications.length === 0 ? (
                    <div className="p-16 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-zinc-500 text-xs font-medium">Cargando notificaciones...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState filtered={isFiltered} />
                ) : (
                    <div>
                        {filtered.map((notif) => (
                            <NotificationRow
                                key={notif._id}
                                notif={notif}
                                onRead={markAsRead}
                                onDelete={removeNotification}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationsPage