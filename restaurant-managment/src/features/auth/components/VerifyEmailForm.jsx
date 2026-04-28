import { useForm } from 'react-hook-form'
import useAuthStore from '../store/authStore'
import { useState } from 'react'

const VerifyEmailForm = ({ onBack }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const verifyEmail = useAuthStore((state) => state.verifyEmail)
  const [verified, setVerified] = useState(false)

  const onSubmit = async (data) => {
    try {
      await verifyEmail(data.token)
      setVerified(true)
    } catch (error) {
      alert('Token inválido o expirado')
    }
  }

  if (verified) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 flex items-center justify-center text-3xl mx-auto">
          ✅
        </div>
        <p className="text-white font-semibold">¡Correo verificado!</p>
        <p className="text-zinc-400 text-sm">Tu cuenta ha sido verificada exitosamente.</p>
        <button
          onClick={onBack}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors mt-4"
        >
          Ir al login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
          Token de verificación
        </label>
        <input
          {...register('token', { required: 'El token es requerido' })}
          type="text"
          placeholder="Pega tu token aquí"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
        />
        {errors.token && <p className="text-red-400 text-xs mt-1">{errors.token.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
            Verificando...
          </div>
        ) : 'Verificar correo'}
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

export default VerifyEmailForm