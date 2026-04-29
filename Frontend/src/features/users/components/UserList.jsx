import { useEffect, useState, useRef } from 'react'
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Shield, 
  Camera, 
  Edit3, 
  Save, 
  X,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useUserStore from '../store/userStore'

const UserProfile = () => {
  const { profile, loading, error, fetchProfile, updateProfile, updateProfilePicture } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', surname: '', phone: '' })
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        surname: profile.surname || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const toastId = toast.loading('Subiendo imagen de perfil...')
    try {
      const data = new FormData()
      data.append('image', file)
      await updateProfilePicture(data)
      toast.success('Imagen de perfil actualizada', { id: toastId })
    } catch (err) {
      toast.error('Error al subir la imagen', { id: toastId })
    }
  }

  const handleSave = async () => {
    const toastId = toast.loading('Guardando cambios...')
    try {
      await updateProfile(formData)
      setIsEditing(false)
      toast.success('Perfil actualizado correctamente', { id: toastId })
    } catch (err) {
      toast.error('Error al actualizar el perfil', { id: toastId })
    }
  }

  if (loading && !profile) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  )
  
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-3xl text-center">
      <p>Error al cargar el perfil: {error}</p>
      <button onClick={fetchProfile} className="mt-4 text-sm font-bold underline">Reintentar</button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
        <p className="text-zinc-500 mt-1">Gestiona tu información personal y preferencias.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Izquierdo: Avatar y Resumen */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-xl">
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 p-1 shadow-2xl shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-[22px] bg-zinc-900 overflow-hidden flex items-center justify-center">
                  {profile?.profilePicture ? (
                    <img src={profile.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={48} className="text-orange-500" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-zinc-800 border border-zinc-700 p-2.5 rounded-2xl text-orange-500 shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Camera size={18} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-bold text-white tracking-tight">{profile?.username}</h2>
              <p className="text-zinc-500 text-sm mt-1">{profile?.email}</p>
            </div>

            <div className="mt-6 w-full pt-6 border-t border-zinc-800">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider">
                <Shield size={14} />
                {profile?.roles?.[0] || 'Usuario'}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-4">Estadísticas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-xs font-medium">Estado cuenta</span>
                <span className="flex items-center gap-1 text-green-500 text-xs font-bold">
                  <CheckCircle2 size={12} /> {profile?.status ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Detalles y Edición */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-white text-xl font-bold">Información Personal</h3>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-orange-500 text-sm font-bold hover:text-orange-400 transition-colors bg-orange-500/5 px-4 py-2 rounded-xl"
                >
                  <Edit3 size={16} /> Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                  >
                    <Save size={16} /> Guardar
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider ml-1">Nombre</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input 
                    type="text" 
                    value={formData.name}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider ml-1">Apellido</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input 
                    type="text" 
                    value={formData.surname}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({...formData, surname: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider ml-1">Email (No editable)</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                  <input 
                    type="text" 
                    value={profile?.email || ''} 
                    disabled 
                    className="w-full bg-zinc-800/20 border border-zinc-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-zinc-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider ml-1">Teléfono</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-sm">+502</span>
                  <input 
                    type="text" 
                    value={formData.phone}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-16 pr-4 py-3.5 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold">Seguridad de la cuenta</h4>
                <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                  Tu cuenta está protegida con cifrado de extremo a extremo. Para cambiar tu contraseña o correo electrónico de seguridad, contacta al administrador del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile