import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Lock, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'

const ResetPasswordForm = ({ onBack }) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [showPassword, setShowPassword] = useState(false)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const password = watch('password')

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Token no encontrado en la URL')
      return
    }

    const toastId = toast.loading('Actualizando contraseña...')
    try {
      await resetPassword(token, data.password)
      toast.success('¡Contraseña actualizada con éxito!', { id: toastId })
      setTimeout(() => {
        onBack ? onBack() : navigate('/login')
      }, 2000)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error al restablecer la contraseña', { id: toastId })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-4">
        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block opacity-70">
            Nueva Contraseña
          </label>
          <div className="relative group">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
            <input
              {...register('password', { 
                required: 'La contraseña es requerida',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' }
              })}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-2 ml-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block opacity-70">
            Confirmar Contraseña
          </label>
          <div className="relative group">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
            <input
              {...register('confirmPassword', { 
                required: 'Debes confirmar la contraseña',
                validate: value => value === password || 'Las contraseñas no coinciden'
              })}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-2 ml-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
        ) : <Save size={18} />}
        <span>Cambiar Contraseña</span>
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al login
      </button>
    </form>
  )
}

export default ResetPasswordForm