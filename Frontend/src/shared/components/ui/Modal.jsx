const Modal = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header - Fijo */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800/50 flex-shrink-0">
          <h2 className="text-white font-bold text-2xl">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
          >
            ✕
          </button>
        </div>
        
        {/* Content Area - Scrollable */}
        <div className="overflow-y-auto custom-scrollbar">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal