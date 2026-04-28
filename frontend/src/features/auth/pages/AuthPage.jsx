import { useState } from 'react'
import LoginForm from '../components/LoginForm'
import ForgotPasswordForm from '../components/ForgotPasswordForm'
import VerifyEmailForm from '../components/VerifyEmailForm'

const AuthPage = () => {
  const [view, setView] = useState('login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4"
      style={{ background: 'radial-gradient(ellipse at top, #27272a 0%, #09090b 70%)' }}>

      <div className="fixed top-[-150px] right-[-150px] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.08) 0%, transparent 70%)' }}></div>
      <div className="fixed bottom-[-150px] left-[-150px] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.08) 0%, transparent 70%)' }}></div>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-px bg-yellow-500 rounded-full"></div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 flex items-center justify-center text-xl">
            🍽️
          </div>
          <span className="text-white font-bold text-xl tracking-wide">GastroManager</span>
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

        <p className="text-center text-zinc-600 text-xs mt-6">
          © 2025 GastroManager. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default AuthPage