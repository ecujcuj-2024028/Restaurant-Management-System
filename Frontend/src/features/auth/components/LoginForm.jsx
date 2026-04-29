import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const LoginForm = ({ onForgotPassword }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
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
        <input
          {...register('email', { required: 'Este campo es requerido' })}
          type="text"
          placeholder="usuario o correo@ejemplo.com"
          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
        />
        {errors.email && <p className="text-red-400 text-xs mt-2 ml-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block opacity-70">
          Contraseña
        </label>
        <input
          {...register('password', { required: 'La contraseña es requerida' })}
          type="password"
          placeholder="••••••••"
          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
        />
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
    </form>
  )
}

export default LoginForm