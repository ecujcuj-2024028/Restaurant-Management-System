import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft } from 'lucide-react'
import useAuthStore from '../store/authStore'

const ForgotPasswordForm = ({ onBack }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm()
  const forgotPassword = useAuthStore((state) => state.forgotPassword)
  const [sent, setSent] = useState(false)

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email)
      setSent(true)
      reset()
    } catch (error) {
      alert('Error al enviar el correo, verifica que el email sea correcto')
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/5">
          <Mail size={40} className="text-orange-500" />
        </div>
        <div>
          <p className="text-white text-xl font-bold">¡Correo enviado!</p>
          <p className="text-zinc-500 text-sm mt-2">Revisa tu bandeja de entrada y sigue las instrucciones para recuperar tu cuenta.</p>
        </div>
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white text-sm font-medium transition-colors pt-4"
        >
          <ArrowLeft size={16} />
          Volver al login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div>
        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block opacity-70">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            {...register('email', {
              required: 'El correo es requerido',
              pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' }
            })}
            type="email"
            placeholder="correo@ejemplo.com"
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
          />
        </div>
        {errors.email && <p className="text-red-400 text-xs mt-2">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>Enviando...</span>
          </div>
        ) : 'Enviar instrucciones'}
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

export default ForgotPasswordForm