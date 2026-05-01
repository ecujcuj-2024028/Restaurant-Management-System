import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import useAuthStore from '../store/authStore'

const LoginForm = ({ onForgotPassword, onVerifyEmail }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const [showPassword, setShowPassword] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    const toastId = toast.loading('Iniciando sesión...')
    try {
      const user = await login(data.email, data.password)
      const role = user?.roles?.[0]
      
      toast.success(`¡Bienvenido de nuevo, ${user.username || ''}!`, { id: toastId })

      if (role === 'ADMIN_SISTEMA') {
        navigate('/dashboard')
      } else if (role === 'ADMIN_RESTAURANTE') {
        navigate('/restaurants')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error('Credenciales incorrectas o cuenta no verificada', { id: toastId })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div>
        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block opacity-70">
          Usuario o correo
        </label>
        <div className="relative group">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
          <input
            {...register('email', { required: 'Este campo es requerido' })}
            type="text"
            placeholder="usuario o correo@ejemplo.com"
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
          />
        </div>
        {errors.email && <p className="text-red-400 text-xs mt-2 ml-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block opacity-70">
          Contraseña
        </label>
        <div className="relative group">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
          <input
            {...register('password', { required: 'La contraseña es requerida' })}
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

      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-3 text-sm text-zinc-400 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input type="checkbox" className="peer appearance-none w-5 h-5 border border-zinc-700 rounded-md checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer" />
            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="group-hover:text-zinc-300 transition-colors">Recordarme</span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 mt-2"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>Iniciando sesión...</span>
          </div>
        ) : 'Iniciar sesión'}
      </button>

      <div className="text-center pt-2">
        <button 
          type="button"
          onClick={onVerifyEmail}
          className="text-xs text-zinc-500 hover:text-orange-500 transition-colors uppercase tracking-widest font-bold"
        >
          Tengo un código de verificación
        </button>
      </div>
    </form>
  )
}

export default LoginForm