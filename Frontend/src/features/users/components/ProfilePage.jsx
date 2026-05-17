import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Lock, 
  Camera, 
  Save, 
  ChevronRight,
  RefreshCw,
  LogOut
} from 'lucide-react'
import useUserStore from '../store/userStore'
import useAuthStore from '../../auth/store/authStore'
import { toast } from 'react-hot-toast'

const ProfilePage = () => {
  const { profile, fetchProfile, updateProfile, updateProfilePicture, updatePassword, requestRoleChange, loading } = useUserStore()
  const logout = useAuthStore((state) => state.logout)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const { register: regPass, handleSubmit: handlePassSubmit, reset: resetPass, formState: { errors: passErrors } } = useForm()

  useEffect(() => {
    if (!profile) fetchProfile()
  }, [profile, fetchProfile])

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        surname: profile.surname,
        phone: profile.phone
      })
    }
  }, [profile, reset])

  const onUpdateInfo = async (data) => {
    try {
      await updateProfile(data)
      toast.success('Información actualizada correctamente')
    } catch (error) {
      toast.error(error.message || 'Error al actualizar perfil')
    }
  }

  const onChangePassword = async (data) => {
    try {
      await updatePassword(data)
      toast.success('Contraseña actualizada con éxito')
      setIsChangingPassword(false)
      resetPass()
    } catch (error) {
      toast.error(error.message || 'Error al cambiar contraseña')
    }
  }

  const onFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    const toastId = toast.loading('Subiendo imagen...')
    try {
      await updateProfilePicture(formData)
      toast.success('Foto de perfil actualizada', { id: toastId })
    } catch (error) {
      toast.error('Error al subir imagen', { id: toastId })
    }
  }

  const handleRoleRequest = async (role) => {
    try {
      await requestRoleChange(role)
      toast.success(`Solicitud para ${role} enviada correctamente`)
    } catch (error) {
      toast.error(error.message || 'Ya tienes una solicitud pendiente')
    }
  }

  if (!profile && loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const userRole = profile?.roles?.[0] || 'CLIENTE'

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Perfil */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          {/* Avatar con upload */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-orange-400 to-orange-600 p-1 shadow-2xl shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-[1.8rem] bg-zinc-950 flex items-center justify-center overflow-hidden">
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-orange-500" />
                )}
              </div>
            </div>
            <label className="absolute -bottom-2 -right-2 bg-zinc-800 hover:bg-orange-500 text-white p-3 rounded-2xl cursor-pointer shadow-xl transition-all hover:scale-110 border border-zinc-700">
              <Camera size={18} />
              <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
            </label>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-black text-white mb-1">{profile?.name} {profile?.surname}</h1>
            <p className="text-zinc-600 text-[10px] font-mono mb-4 uppercase tracking-widest opacity-70">ID: {profile?.id || profile?._id}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="bg-orange-500/10 text-orange-500 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-orange-500/20 flex items-center gap-2">
                <Shield size={12} />
                {userRole.replace('_', ' ')}
              </span>
              <span className="bg-zinc-800 text-zinc-400 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-zinc-700 flex items-center gap-2">
                <Mail size={12} />
                {profile?.email}
              </span>
            </div>
          </div>

          <button 
            onClick={() => { logout(); window.location.href = '/login' }}
            className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all group"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Formulario Datos */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                <UserIcon size={20} />
              </div>
              Información Personal
            </h2>

            <form onSubmit={handleSubmit(onUpdateInfo)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nombre</label>
                  <input 
                    {...register('name', { required: 'Campo requerido' })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Apellido</label>
                  <input 
                    {...register('surname', { required: 'Campo requerido' })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1 flex items-center gap-2">
                    <Phone size={12} /> Teléfono
                  </label>
                  <input 
                    {...register('phone', { required: 'Campo requerido', pattern: { value: /^[0-9]{8}$/, message: '8 dígitos' } })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white focus:border-orange-500 outline-none transition-all"
                    placeholder="Ej. 12345678"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Guardar Cambios
              </button>
            </form>
          </section>

          {/* Seguridad / Contraseña */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                  <Lock size={20} />
                </div>
                Seguridad
              </h2>
              <button 
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="text-xs font-bold text-orange-500 hover:underline"
              >
                {isChangingPassword ? 'Cancelar' : 'Cambiar contraseña'}
              </button>
            </div>

            {isChangingPassword ? (
              <form onSubmit={handlePassSubmit(onChangePassword)} className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <input 
                    type="password"
                    placeholder="Contraseña Actual"
                    {...regPass('currentPassword', { required: true })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <input 
                    type="password"
                    placeholder="Nueva Contraseña"
                    {...regPass('newPassword', { required: true, minLength: 8 })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl transition-all">
                  Actualizar Contraseña
                </button>
              </form>
            ) : (
              <p className="text-zinc-500 text-sm">Tu contraseña no ha sido cambiada recientemente. Mantén tu cuenta segura.</p>
            )}
          </section>
        </div>

        {/* Columna Derecha: Roles */}
        <div className="space-y-8">
          <section className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                <RefreshCw size={20} />
              </div>
              Cambio de Rol
            </h2>
            
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              ¿Necesitas más permisos? Envía una solicitud para cambiar tu rol actual. Un administrador del sistema revisará tu petición.
            </p>

            <div className="space-y-3">
              {userRole === 'CLIENTE' && (
                <>
                  <button 
                    onClick={() => handleRoleRequest('ADMIN_RESTAURANTE')}
                    className="w-full group flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-orange-500/10 border border-zinc-700 hover:border-orange-500/50 rounded-2xl transition-all text-left"
                  >
                    <div>
                      <p className="text-white text-sm font-bold">Admin Restaurante</p>
                      <p className="text-zinc-500 text-[10px]">Gestiona tu propio local</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-orange-500" />
                  </button>

                  <button 
                    onClick={() => handleRoleRequest('ADMIN_SISTEMA')}
                    className="w-full group flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-blue-500/10 border border-zinc-700 hover:border-blue-500/50 rounded-2xl transition-all text-left"
                  >
                    <div>
                      <p className="text-white text-sm font-bold">Admin Sistema</p>
                      <p className="text-zinc-500 text-[10px]">Control total de la red</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-blue-500" />
                  </button>
                </>
              )}

              {userRole === 'ADMIN_RESTAURANTE' && (
                <>
                  <button 
                    onClick={() => handleRoleRequest('ADMIN_SISTEMA')}
                    className="w-full group flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-blue-500/10 border border-zinc-700 hover:border-blue-500/50 rounded-2xl transition-all text-left"
                  >
                    <div>
                      <p className="text-white text-sm font-bold">Admin Sistema</p>
                      <p className="text-zinc-500 text-[10px]">Subir a rango global</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-blue-500" />
                  </button>

                  <button 
                    onClick={() => handleRoleRequest('CLIENTE')}
                    className="w-full group flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 rounded-2xl transition-all text-left"
                  >
                    <div>
                      <p className="text-white text-sm font-bold">Volver a Cliente</p>
                      <p className="text-zinc-500 text-[10px]">Renunciar a privilegios</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600" />
                  </button>
                </>
              )}

              {userRole === 'ADMIN_SISTEMA' && (
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                  <p className="text-orange-500 text-xs font-bold text-center italic">
                    Ya tienes el rango más alto disponible.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
