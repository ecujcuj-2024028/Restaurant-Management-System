import { AlertTriangle } from 'lucide-react'

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h3 className="text-white text-xl font-bold text-center mb-2">¿Estás seguro?</h3>
        <p className="text-zinc-400 text-sm text-center mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3.5 rounded-2xl text-sm font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-red-500/20"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog