import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Shield, Camera, Save, Key, ChevronRight, Star } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useAuthStore from '../../auth/store/authStore'
import { requestRoleUpgrade } from '../../../shared/api/auth'

const UserProfile = () => {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || ''
  })

  const isAdmin = user?.roles?.some(role => role === 'ADMIN_RESTAURANTE' || role === 'ADMIN_SISTEMA')

  const handleUpdate = (e) => {
    e.preventDefault()
    toast.success('Perfil actualizado (Simulación)')
    setIsEditing(false)
  }

  const handleRequestRole = async () => {
    const toastId = toast.loading('Enviando solicitud...')
    setIsRequesting(true)
    try {
      await requestRoleUpgrade('ADMIN_RESTAURANTE')
      toast.success('Solicitud enviada al administrador del sistema', { id: toastId })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar solicitud', { id: toastId })
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Mi Perfil</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Gestione su identidad y privilegios en la plataforma.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card de Avatar/Info Rápida */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-orange-500 to-orange-700" />
            
            <div className="relative z-10">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-[2rem] bg-zinc-800 border-4 border-zinc-950 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                  {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-xl text-white shadow-lg hover:bg-orange-600 transition-all active:scale-90">
                  <Camera size={18} />
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-white truncate">{user?.name} {user?.surname}</h2>
              <p className="text-zinc-500 text-sm font-medium">@{user?.username}</p>
              
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {user?.roles?.map(role => (
                  <span key={role} className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-500/20">
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Solicitud de Rango (Solo para clientes) */}
          {!isAdmin && (
            <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                  <Star size={18} className="text-orange-500" />
                  Privilegios
                </h3>
                <p className="text-zinc-500 text-[10px] font-medium leading-relaxed mb-6">
                  ¿Desea registrar y gestionar su propio restaurante? Solicite el rango de administrador.
                </p>
                <button 
                  onClick={handleRequestRole}
                  disabled={isRequesting}
                  className="w-full flex items-center justify-between p-4 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white text-sm font-black transition-all group disabled:opacity-50"
                >
                  <span>Solicitar Admin</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="absolute -bottom-4 -right-4 text-orange-500/5">
                <Shield size={100} />
              </div>
            </div>
          )}

          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Shield size={18} className="text-orange-500" />
              Seguridad
            </h3>
            <button className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl text-zinc-300 text-sm font-bold transition-all group">
              <span className="flex items-center gap-3">
                <Key size={18} className="text-zinc-500 group-hover:text-orange-500" />
                Cambiar Contraseña
              </span>
            </button>
          </div>
        </div>

        {/* Formulario de Datos */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-xl">
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="text" 
                      value={formData.name}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Apellido</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="text" 
                      value={formData.surname}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({...formData, surname: e.target.value})}
                      className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="email" 
                      value={formData.email}
                      disabled={true} 
                      className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Nombre de Usuario</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-lg">@</span>
                    <input 
                      type="text" 
                      value={formData.username}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                {isEditing ? (
                  <>
                    <button 
                      type="submit"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Guardar Cambios
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-bold transition-all"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-bold transition-all border border-white/5"
                  >
                    Editar Información
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default UserProfile
