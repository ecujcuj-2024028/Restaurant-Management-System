import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../../features/auth/store/authStore'
import useUserStore from '../../../features/users/store/userStore'
import useNotificationStore from '../../../features/notifications/store/notificationStore'
import { User as UserIcon, Bell, LogOut, Settings, ChevronDown, Menu } from 'lucide-react'
import NotificationDropdown from '../../../features/notifications/components/NotificationDropdown'

const Navbar = ({ onMenuClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const { profile, fetchProfile } = useUserStore()
  const { unreadCount, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    if (!profile) {
      fetchProfile()
    }
    
    const rid = profile?.restaurantId || user?.restaurantId
    fetchNotifications(rid)

    // Polling de notificaciones cada 2 minutos
    const interval = setInterval(() => {
      fetchNotifications(rid)
    }, 120000)

    return () => clearInterval(interval)
  }, [profile, fetchProfile, fetchNotifications, user?.restaurantId])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userData = profile || user

  return (
    <header className="bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 text-zinc-400 hover:text-white lg:hidden transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="hidden sm:block">
          <p className="text-white font-bold">Panel de Control</p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2 transition-colors relative ${isNotificationsOpen ? 'text-orange-500' : 'text-zinc-500 hover:text-orange-500'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-4.5 bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-zinc-950 px-1 animate-in zoom-in duration-300">
                {unreadCount > 9 ? '+9' : unreadCount}
              </span>
            )}
          </button>
          
          <NotificationDropdown 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
          />
        </div>

        <div className="h-8 w-px bg-zinc-800 hidden xs:block"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">
                {userData?.username || 'Admin'}
              </span>
              <span className="text-zinc-600 text-[9px] font-mono leading-none opacity-80 uppercase tracking-tighter mb-1">
                ID: {userData?.id?.slice(0, 8)}...
              </span>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter flex items-center gap-1">
                {userData?.roles?.[0] || 'Administrador'}
                <ChevronDown size={10} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </span>
            </div>
            
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 p-0.5 shadow-lg shadow-orange-500/10 group-hover:shadow-orange-500/20 transition-all transform group-hover:scale-105">
                <div className="w-full h-full rounded-[14px] bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {profile?.profilePicture ? (
                    <img 
                      src={profile.profilePicture} 
                      alt={userData?.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={20} className="text-orange-500" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-zinc-950 rounded-full shadow-sm"></div>
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-zinc-800 mb-2">
                <p className="text-white text-sm font-bold truncate">{userData?.email}</p>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5">Sesión activa</p>
              </div>

              <Link 
                to="/profile" 
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors mx-2 rounded-2xl group"
              >
                <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <UserIcon size={16} />
                </div>
                <span className="text-sm font-medium">Mi Perfil</span>
              </Link>

              <div className="my-2 border-t border-zinc-800 mx-4"></div>

              <button 
                onClick={handleLogout}
                className="w-[calc(100%-1rem)] flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mx-2 rounded-2xl group"
              >
                <div className="p-2 bg-red-500/10 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <LogOut size={16} />
                </div>
                <span className="text-sm font-bold">Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar