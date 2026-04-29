import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Utensils } from 'lucide-react'
import LoginForm from '../components/LoginForm'
import ForgotPasswordForm from '../components/ForgotPasswordForm'
import VerifyEmailForm from '../components/VerifyEmailForm'
import ResetPasswordForm from '../components/ResetPasswordForm'

const AuthPage = () => {
  const [view, setView] = useState('login')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Si detectamos un token en la URL, mostramos la vista de reset
    if (searchParams.get('token')) {
      setView('reset')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4"
      style={{ background: 'radial-gradient(ellipse at top, #27272a 0%, #09090b 70%)' }}>

      <div className="fixed top-[-150px] right-[-150px] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)' }}></div>
      <div className="fixed bottom-[-150px] left-[-150px] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)' }}></div>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600"></div>

        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Utensils className="text-white" size={24} />
          </div>
          <span className="text-white font-black text-2xl tracking-tighter">GastroManager</span>
        </div>

        {view === 'login' && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white mb-1">Bienvenido</h1>
              <p className="text-zinc-500 text-sm">Ingresa tus credenciales para continuar</p>
            </div>
            <LoginForm
              onForgotPassword={() => setView('forgot')}
              onVerifyEmail={() => setView('verify')}
            />
          </>
        )}

        {view === 'forgot' && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white mb-1">Recuperar contraseña</h1>
              <p className="text-zinc-500 text-sm">Te enviaremos un correo con instrucciones</p>
            </div>
            <ForgotPasswordForm onBack={() => setView('login')} />
          </>
        )}

        {view === 'verify' && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white mb-1">Verificar correo</h1>
              <p className="text-zinc-500 text-sm">Ingresa el token que recibiste en tu correo</p>
            </div>
            <VerifyEmailForm onBack={() => setView('login')} />
          </>
        )}

        {view === 'reset' && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white mb-1">Nueva Contraseña</h1>
              <p className="text-zinc-500 text-sm">Estás a un paso de recuperar tu acceso</p>
            </div>
            <ResetPasswordForm onBack={() => setView('login')} />
          </>
        )}

        <p className="text-center text-zinc-600 text-xs mt-8">
          © 2025 GastroManager. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default AuthPage