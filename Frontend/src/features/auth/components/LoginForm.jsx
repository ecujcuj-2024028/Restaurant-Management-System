import { useForm } from 'react-hook-form'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const LoginForm = ({ onForgotPassword }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password)
      const role = user?.roles?.[0]

      if (role === 'ADMIN_SISTEMA') {
        navigate('/dashboard')
      } else if (role === 'ADMIN_RESTAURANTE') {
        navigate('/restaurants')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      alert('Credenciales incorrectas')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
          Usuario o correo
        </label>
        <input
          {...register('email', { required: 'Este campo es requerido' })}
          type="text"
          placeholder="usuario o correo@ejemplo.com"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
          Contraseña
        </label>
        <input
          {...register('password', { required: 'La contraseña es requerida' })}
          type="password"
          placeholder="••••••••"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input type="checkbox" className="accent-yellow-500 w-4 h-4" />
          Recordarme
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
            Iniciando sesión...
          </div>
        ) : 'Iniciar sesión'}
      </button>

      <p className="text-center text-zinc-500 text-xs mt-4">
        © 2025 GastroManager. Todos los derechos reservados.
      </p>
    </form>
  )
}

export default LoginForm