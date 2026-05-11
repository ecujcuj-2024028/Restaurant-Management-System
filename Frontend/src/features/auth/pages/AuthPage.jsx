import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Utensils } from 'lucide-react'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import ForgotPasswordForm from '../components/ForgotPasswordForm'
import VerifyEmailForm from '../components/VerifyEmailForm'
import ResetPasswordForm from '../components/ResetPasswordForm'

const AuthPage = () => {
  const [view, setView] = useState('login')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token') || searchParams.get('verifyToken')
    if (!token) return

    // Decodifica el payload del JWT para saber qué tipo de token es
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.type === 'EMAIL_VERIFICATION') {
        setView('verify')
      } else {
        setView('reset')
      }
    } catch {
      // Si no se puede decodificar, asumir reset (comportamiento anterior)
      setView('reset')
    }
  }, [searchParams])

  const titles = {
    login:    { h1: 'Bienvenido',           sub: 'Ingresa tus credenciales para continuar' },
    register: { h1: 'Crear cuenta',         sub: 'Completa el formulario para registrarte' },
    forgot:   { h1: 'Recuperar contraseña', sub: 'Te enviaremos un correo con instrucciones' },
    verify:   { h1: 'Verificar correo',     sub: 'Ingresa el token que recibiste en tu correo' },
    reset:    { h1: 'Nueva Contraseña',     sub: 'Estás a un paso de recuperar tu acceso' },
  }

  const { h1, sub } = titles[view] || titles.login

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4"
      style={{ background: 'radial-gradient(ellipse at top, #27272a 0%, #09090b 70%)' }}>

      <div className="fixed top-[-150px] right-[-150px] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)' }}></div>
      <div className="fixed bottom-[-150px] left-[-150px] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)' }}></div>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600"></div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Utensils className="text-white" size={24} />
          </div>
          <span className="text-white font-black text-2xl tracking-tighter">GastroManager</span>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">{h1}</h1>
          <p className="text-zinc-500 text-sm">{sub}</p>
        </div>

        {view === 'login' && (
          <LoginForm
            onForgotPassword={() => setView('forgot')}
            onVerifyEmail={() => setView('verify')}
            onRegister={() => setView('register')}
          />
        )}

        {view === 'register' && (
          <RegisterForm
            onBack={() => setView('login')}
            onVerifyEmail={() => setView('verify')}
          />
        )}

        {view === 'forgot' && (
          <ForgotPasswordForm onBack={() => setView('login')} />
        )}

        {view === 'verify' && (
          <VerifyEmailForm onBack={() => setView('login')} />
        )}

        {view === 'reset' && (
          <ResetPasswordForm onBack={() => setView('login')} />
        )}

        <p className="text-center text-zinc-600 text-xs mt-8">
          © 2025 GastroManager. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default AuthPage