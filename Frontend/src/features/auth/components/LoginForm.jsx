import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import useAuthStore from '../store/authStore'

const LoginForm = ({ onForgotPassword, onVerifyEmail, onRegister }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const [showPassword, setShowPassword] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    const toastId = toast.loading('Iniciando sesión...')
    try {
      const user = await login(data.email, data.password)
      const role = user?.roles?.[0]
      toast.success(`¡Bienvenido, ${user.username || ''}! 🍽️`, { id: toastId })
      if (role === 'ADMIN_SISTEMA') navigate('/dashboard')
      else if (role === 'ADMIN_RESTAURANTE') navigate('/restaurants')
      else navigate('/dashboard')
    } catch (error) {
      toast.error('Credenciales incorrectas o cuenta no verificada', { id: toastId })
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Email */}
      <motion.div variants={itemVariants}>
        <label className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 block">
          Usuario o correo
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-zinc-800 group-focus-within:bg-orange-500/10 flex items-center justify-center transition-all duration-300">
            <Mail size={16} className="text-zinc-500 group-focus-within:text-orange-500 transition-colors duration-300" />
          </div>
          <input
            {...register('email', { required: 'Este campo es requerido' })}
            type="text"
            placeholder="usuario o correo@ejemplo.com"
            className="w-full bg-zinc-800/40 border border-zinc-700/50 hover:border-zinc-600 rounded-2xl pl-16 pr-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 text-sm"
          />
        </div>
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
            {errors.email.message}
          </motion.p>
        )}
      </motion.div>

      {/* Password */}
      <motion.div variants={itemVariants}>
        <label className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 block">
          Contraseña
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-zinc-800 group-focus-within:bg-orange-500/10 flex items-center justify-center transition-all duration-300">
            <Lock size={16} className="text-zinc-500 group-focus-within:text-orange-500 transition-colors duration-300" />
          </div>
          <input
            {...register('password', { required: 'La contraseña es requerida' })}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full bg-zinc-800/40 border border-zinc-700/50 hover:border-zinc-600 rounded-2xl pl-16 pr-14 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white transition-all duration-200"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
            {errors.password.message}
          </motion.p>
        )}
      </motion.div>

      {/* Recordarme + Forgot */}
      <motion.div variants={itemVariants} className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className="peer appearance-none w-5 h-5 border border-zinc-700 rounded-lg checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer"
            />
            <svg
              className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-zinc-500 text-sm group-hover:text-zinc-300 transition-colors">Recordarme</span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-semibold text-zinc-500 hover:text-orange-500 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </motion.div>

      {/* Submit */}
      <motion.div variants={itemVariants}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 group"
        >
          <span className="flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar sesión
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
      </motion.div>

      {/* Divider */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 py-1">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">o</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </motion.div>

      {/* Links */}
      <motion.div variants={itemVariants} className="space-y-3 text-center">
        <button
          type="button"
          onClick={onVerifyEmail}
          className="w-full py-3 rounded-2xl border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:bg-zinc-900"
        >
          Tengo un código de verificación
        </button>
        <p className="text-zinc-500 text-sm">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={onRegister}
            className="text-orange-500 hover:text-orange-400 font-black transition-colors"
          >
            Regístrate
          </button>
        </p>
      </motion.div>
    </motion.form>
  )
}

export default LoginForm