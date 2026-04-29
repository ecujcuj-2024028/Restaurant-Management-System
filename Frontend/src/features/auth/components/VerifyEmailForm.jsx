import { useForm } from 'react-hook-form'
import useAuthStore from '../store/authStore'
import { useState } from 'react'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

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
      <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-3xl bg-green-500/10 flex items-center justify-center mx-auto shadow-lg shadow-green-500/5">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <div>
          <p className="text-white text-xl font-bold">¡Correo verificado!</p>
          <p className="text-zinc-500 text-sm mt-2">Tu cuenta ha sido activada exitosamente.</p>
        </div>
        <button
          onClick={onBack}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20"
        >
          Ir al login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div>
        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block opacity-70">
          Token de verificación
        </label>
        <input
          {...register('token', { required: 'El token es requerido' })}
          type="text"
          placeholder="Pega tu token aquí"
          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-center tracking-widest font-mono"
        />
        {errors.token && <p className="text-red-400 text-xs mt-2">{errors.token.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>Verificando...</span>
          </div>
        ) : 'Verificar correo'}
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

export default VerifyEmailForm