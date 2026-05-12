import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function App() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // Si hay historial regresamos, si no vamos al dashboard
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Fondo: Gran 404 para profundidad visual */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[30vw] font-black text-zinc-900/50 leading-none">
          404
        </span>
      </div>

      {/* Elementos decorativos de fondo (Glows) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-800/30 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Contenedor Principal */}
      <div className="relative z-10 text-center max-w-lg w-full flex flex-col items-center">
        
        {/* Insignia Error */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold mb-8 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
        >
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Error 404
        </motion.div>

        {/* Icono con Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="relative mb-8"
        >
          <div className="w-28 h-28 rounded-3xl bg-zinc-900/60 border border-white/5 flex items-center justify-center shadow-2xl shadow-orange-500/5 backdrop-blur-md">
            <Utensils size={48} className="text-orange-500" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Textos */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight"
        >
          Página no encontrada
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-zinc-400 text-lg mb-10 leading-relaxed font-medium max-w-md"
        >
          Lo sentimos, parece que el plato que buscas se ha caído del menú o la dirección es incorrecta. 
        </motion.p>

        {/* Botones */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
        >
          <button
            onClick={handleGoBack}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent hover:bg-zinc-800/50 text-zinc-300 rounded-xl font-semibold transition-all border border-zinc-800 hover:border-zinc-700 active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Regresar
          </button>
          
          <button
            onClick={handleGoHome}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] active:scale-95 cursor-pointer"
          >
            <Home size={18} className="transition-transform group-hover:scale-110" />
            Ir al Inicio
          </button>
        </motion.div>

      </div>
    </div>
  );
}