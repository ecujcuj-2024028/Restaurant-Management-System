import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Utensils, ChefHat, Star, Shield, TrendingUp } from 'lucide-react'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import ForgotPasswordForm from '../components/ForgotPasswordForm'
import VerifyEmailForm from '../components/VerifyEmailForm'
import ResetPasswordForm from '../components/ResetPasswordForm'

const FEATURES = [
  { icon: ChefHat, text: 'Gestión completa de menús y productos' },
  { icon: TrendingUp, text: 'Reportes y analytics en tiempo real' },
  { icon: Shield, text: 'Control de acceso por roles' },
  { icon: Star, text: 'Experiencia premium para tu restaurante' },
]

const AuthPage = () => {
  const [view, setView] = useState('login')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token') || searchParams.get('verifyToken')
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.type === 'EMAIL_VERIFICATION') {
        setView('verify')
      } else {
        setView('reset')
      }
    } catch {
      setView('reset')
    }
  }, [searchParams])

  const titles = {
    login:    { h1: 'Bienvenido',           sub: 'Ingresa tus credenciales para continuar' },
    register: { h1: 'Crear cuenta',         sub: 'Completa el formulario para registrarte' },
    forgot:   { h1: 'Recuperar contraseña', sub: 'Te enviaremos un correo con instrucciones' },
    verify:   { h1: 'Verificar correo',     sub: 'Ingresa el token que recibiste' },
    reset:    { h1: 'Nueva contraseña',     sub: 'Estás a un paso de recuperar tu acceso' },
  }

  const { h1, sub } = titles[view] || titles.login

  return (
    <div className="min-h-screen flex bg-zinc-950">

      {/* ── Lado izquierdo — Decorativo ── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center p-16"
        style={{ background: 'linear-gradient(135deg, #0c0c0d 0%, #18181b 50%, #1c0a00 100%)' }}>

        {/* Glow effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #fb923c 0%, transparent 70%)' }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

        {/* Contenido */}
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-orange-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/30">
            <Utensils size={36} className="text-white" />
          </div>

          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">
            Gastro
            <span className="text-orange-500">Manager</span>
          </h1>
          <p className="text-zinc-400 text-lg mb-12">
            La plataforma todo-en-uno para gestionar tu restaurante
          </p>

          <div className="space-y-4 text-left">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-orange-400" />
                </div>
                <span className="text-zinc-300 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <p className="absolute bottom-8 text-zinc-600 text-xs">
          © 2025 GastroManager · Todos los derechos reservados
        </p>
      </div>

      {/* ── Lado derecho — Formulario ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16"
        style={{ background: 'radial-gradient(ellipse at top right, #1c1917 0%, #09090b 60%)' }}>

        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center">
              <Utensils size={20} className="text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tighter">
              Gastro<span className="text-orange-500">Manager</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-1">{h1}</h2>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage