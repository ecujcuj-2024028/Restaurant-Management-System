import { useEffect, useRef } from 'react'
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  Info,
  Clock,
  X,
  CalendarCheck
} from 'lucide-react'
import useNotificationStore from '../store/notificationStore'
import { formatRelativeTime } from '../../../shared/utils/date-utils'

const NotificationDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null)
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllRead, 
    removeNotification,
    loading
  } = useNotificationStore()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const getIcon = (type) => {
    switch (type) {
      case 'inventory': return <Package size={16} className="text-amber-500" />
      case 'order': return <ShoppingCart size={16} className="text-blue-500" />
      case 'warning': return <AlertTriangle size={16} className="text-red-500" />
      case 'reservation': return <CalendarCheck size={16} className="text-emerald-500" />
      default: return <Info size={16} className="text-orange-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-3 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {unreadCount} nuevas
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={markAllRead}
            title="Marcar todas como leídas"
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <CheckCheck size={18} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-height-[400px] overflow-y-auto custom-scrollbar bg-zinc-900/30">
        {loading && notifications.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-xs font-medium">Buscando actualizaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <Bell size={24} className="text-zinc-600" />
            </div>
            <p className="text-white text-sm font-bold">Todo al día</p>
            <p className="text-zinc-500 text-xs mt-1">No tienes notificaciones pendientes por ahora.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {notifications.map((notif) => (
              <div 
                key={notif._id}
                className={`group px-6 py-4 flex gap-4 transition-colors hover:bg-zinc-800/40 relative ${!notif.isRead ? 'bg-orange-500/5' : ''}`}
              >
                <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${!notif.isRead ? 'bg-zinc-800 shadow-lg' : 'bg-zinc-800/30'}`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm font-bold truncate ${!notif.isRead ? 'text-white' : 'text-zinc-400'}`}>
                      {notif.title}
                    </p>
                    <button 
                      onClick={() => removeNotification(notif._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${!notif.isRead ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock size={10} className="text-zinc-600" />
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                    {!notif.isRead && (
                      <button 
                        onClick={() => markAsRead(notif._id)}
                        className="text-[10px] text-orange-500 font-bold hover:underline ml-auto"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>

                {!notif.isRead && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800 text-center">
          <button className="text-[11px] text-zinc-500 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors">
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
