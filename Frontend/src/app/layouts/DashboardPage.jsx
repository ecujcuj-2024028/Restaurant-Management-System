import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../shared/components/layout/Sidebar'
import Navbar from '../../shared/components/layout/Navbar'
import MobileTabBar from '../../shared/components/layout/MobileTabBar'
import useAuthStore from '../../features/auth/store/authStore'

const DashboardPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const refreshProfile = useAuthStore(state => state.refreshProfile)

  useEffect(() => {
    // Sincronizar perfil con el servidor al entrar al dashboard
    refreshProfile()
  }, [refreshProfile])

  return (
    <div className="flex min-h-screen bg-zinc-950 overflow-x-hidden">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileTabBar />
    </div>
  )
}

export default DashboardPage