import { useEffect } from 'react'
import useUserStore from '../store/userStore'

const UserProfile = () => {
  const { profile, loading, error, fetchProfile } = useUserStore()

  useEffect(() => {
    fetchProfile()
  }, [])

  if (loading) return <div className="text-white text-center mt-10">Cargando perfil...</div>
  if (error) return <div className="text-red-400 text-center mt-10">Error: {error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Mi Perfil</h1>

      <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-3xl">
            {profile?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{profile?.username}</h2>
            <p className="text-gray-400 text-sm">{profile?.email}</p>
            <span className="bg-orange-500 bg-opacity-20 text-orange-400 text-xs px-2 py-1 rounded-full mt-1 inline-block">
              {profile?.role?.name || 'Sin rol'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg px-4 py-3">
            <p className="text-gray-400 text-xs mb-1">Nombre de usuario</p>
            <p className="text-white text-sm">{profile?.username}</p>
          </div>
          <div className="bg-gray-700 rounded-lg px-4 py-3">
            <p className="text-gray-400 text-xs mb-1">Correo electrónico</p>
            <p className="text-white text-sm">{profile?.email}</p>
          </div>
          <div className="bg-gray-700 rounded-lg px-4 py-3">
            <p className="text-gray-400 text-xs mb-1">Estado</p>
            <span className={`text-xs px-2 py-1 rounded-full ${profile?.isActive ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'}`}>
              {profile?.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="bg-gray-700 rounded-lg px-4 py-3">
            <p className="text-gray-400 text-xs mb-1">Miembro desde</p>
            <p className="text-white text-sm">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-GT') : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile