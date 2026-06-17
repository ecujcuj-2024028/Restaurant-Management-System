import { Toaster } from 'react-hot-toast'
import AppRoutes from './app/router/AppRoutes'

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '600',
          },
        }}
      />
      <AppRoutes />
    </>
  )
}

export default App