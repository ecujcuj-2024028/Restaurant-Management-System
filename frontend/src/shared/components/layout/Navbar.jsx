import useAuthStore from '../../../features/auth/store/authStore'

const Navbar = () => {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <h2 className="text-white font-semibold text-lg">Panel de Administración</h2>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 flex items-center justify-center text-yellow-500 font-bold text-sm">
          {user?.username?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium">{user?.username || 'Admin'}</span>
          <span className="text-zinc-500 text-xs">{user?.email || ''}</span>
        </div>
      </div>
    </header>
  )
}

export default Navbar