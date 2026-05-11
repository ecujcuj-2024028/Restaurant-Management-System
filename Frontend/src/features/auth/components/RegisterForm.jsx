import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react'
import useAuthStore from '../store/authStore'

const RegisterForm = ({ onBack, onVerifyEmail }) => {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [registered, setRegistered] = useState(false)
    const registerUser = useAuthStore((state) => state.register)

    const password = watch('password')

    const onSubmit = async (data) => {
        const toastId = toast.loading('Creando cuenta...')
        try {
            await registerUser({
                name: data.name,
                surname: data.surname,
                username: data.username,
                email: data.email,
                password: data.password,
                phone: data.phone,
            })
            toast.success('¡Cuenta creada! Revisa tu correo para verificarla.', { id: toastId })
            setRegistered(true)
        } catch (error) {
            const msg = error?.response?.data?.message || 'El email o usuario ya están en uso'
            toast.error(msg, { id: toastId })
        }
    }

    if (registered) {
        return (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/5">
                    <CheckCircle2 size={40} className="text-orange-500" />
                </div>
                <div>
                    <p className="text-white text-xl font-bold">¡Registro exitoso!</p>
                    <p className="text-zinc-500 text-sm mt-2">
                        Te enviamos un correo de verificación. Activa tu cuenta antes de iniciar sesión.
                    </p>
                </div>
                <button
                    onClick={onVerifyEmail}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20"
                >
                    Tengo un código de verificación
                </button>
                <button
                    onClick={onBack}
                    className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white text-sm font-medium transition-colors"
                >
                    <ArrowLeft size={16} />
                    Volver al login
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-70">
                        Nombre
                    </label>
                    <div className="relative group">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            {...register('name', { required: 'Requerido' })}
                            type="text"
                            placeholder="Juan"
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-9 pr-3 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                        />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1 ml-1">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-70">
                        Apellido
                    </label>
                    <div className="relative group">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            {...register('surname', { required: 'Requerido' })}
                            type="text"
                            placeholder="Pérez"
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-9 pr-3 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                        />
                    </div>
                    {errors.surname && <p className="text-red-400 text-xs mt-1 ml-1">{errors.surname.message}</p>}
                </div>
            </div>

            {/* Username */}
            <div>
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-70">
                    Usuario
                </label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors text-sm font-bold">@</span>
                    <input
                        {...register('username', {
                            required: 'El usuario es requerido',
                            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                            pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Solo letras, números y _' }
                        })}
                        type="text"
                        placeholder="juanperez"
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-10 pr-5 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                    />
                </div>
                {errors.username && <p className="text-red-400 text-xs mt-1 ml-1">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-70">
                    Correo electrónico
                </label>
                <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        {...register('email', {
                            required: 'El correo es requerido',
                            pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' }
                        })}
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-11 pr-5 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                    />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email.message}</p>}
            </div>

            {/* Teléfono */}
            <div>
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-70">
                    Teléfono
                </label>
                <div className="relative group">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        {...register('phone', {
                            required: 'El teléfono es requerido',
                            pattern: { value: /^\d{8}$/, message: 'Debe tener exactamente 8 dígitos' }
                        })}
                        type="tel"
                        placeholder="12345678"
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-11 pr-5 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                    />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone.message}</p>}
            </div>

            {/* Contraseña */}
            <div>
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-70">
                    Contraseña
                </label>
                <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        {...register('password', {
                            required: 'La contraseña es requerida',
                            minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                        })}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-11 pr-11 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password.message}</p>}
            </div>

            {/* Confirmar contraseña */}
            <div>
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-70">
                    Confirmar contraseña
                </label>
                <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        {...register('confirmPassword', {
                            required: 'Confirma tu contraseña',
                            validate: (val) => val === password || 'Las contraseñas no coinciden'
                        })}
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-11 pr-11 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                    >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 mt-2"
            >
                {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Creando cuenta...</span>
                    </div>
                ) : 'Crear cuenta'}
            </button>

            <button
                type="button"
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white text-sm font-medium transition-colors"
            >
                <ArrowLeft size={16} />
                Ya tengo una cuenta
            </button>
        </form>
    )
}

export default RegisterForm