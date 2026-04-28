import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 flex items-center justify-center text-3xl mx-auto">
          📧
        </div>
        <p className="text-white font-semibold">¡Correo enviado!</p>
        <p className="text-zinc-400 text-sm">Revisa tu bandeja de entrada y sigue las instrucciones.</p>
        <button
          onClick={onBack}
          className="w-full text-zinc-500 hover:text-yellow-500 text-sm transition-colors mt-4"
        >
          ← Volver al login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
          Correo electrónico
        </label>
        <input
          {...register('email', {
            required: 'El correo es requerido',
            pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' }
          })}
          type="email"
          placeholder="correo@ejemplo.com"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
            Enviando...
          </div>
        ) : 'Enviar instrucciones'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-zinc-500 hover:text-yellow-500 text-sm transition-colors"
      >
        ← Volver al login
      </button>
    </form>
  )
}

export default ForgotPasswordForm