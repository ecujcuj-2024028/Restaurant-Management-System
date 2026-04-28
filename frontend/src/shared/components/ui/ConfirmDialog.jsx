const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500 bg-opacity-20 mx-auto mb-4">
          <span className="text-red-400 text-2xl">⚠️</span>
        </div>
        <h3 className="text-white text-lg font-bold text-center mb-2">¿Estás seguro?</h3>
        <p className="text-gray-400 text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog