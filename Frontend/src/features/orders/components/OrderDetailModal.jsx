import { getInvoice } from '../../../shared/api/orders'
import { toast } from 'react-hot-toast'
import OrderStatusBadge from './OrderStatusBadge'
import Modal from '../../../shared/components/ui/Modal'

const OrderDetailModal = ({ order, onClose, onStatusChange }) => {
  if (!order) return null

  const STATUS_FLOW = {
    recibido: 'en_preparacion',
    en_preparacion: 'listo',
    listo: 'entregado',
  }

  const nextStatus = STATUS_FLOW[order.status]

  const NEXT_LABEL = {
    en_preparacion: 'Marcar En preparación',
    listo: 'Marcar Listo',
    entregado: 'Marcar Entregado',
  }

  const handleDownloadInvoice = async () => {
    const toastId = toast.loading('Generando factura...')
    try {
      const response = await getInvoice(order._id || order.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `factura-${order._id || order.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Factura descargada', { id: toastId })
    } catch {
      toast.error('Error al generar la factura', { id: toastId })
    }
  }

  return (
    <Modal title={`Pedido #${(order._id || order.id)?.slice(-6).toUpperCase()}`} onClose={onClose}>
      <div className="space-y-5">

        <div className="flex items-center justify-between">
          <OrderStatusBadge status={order.status} />
          <span className="text-zinc-400 text-sm">Mesa #{order.tableNumber}</span>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 space-y-2">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Productos</p>
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-white">{item.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-zinc-500">x{item.quantity}</span>
                <span className="text-white font-semibold">Q{item.subtotal?.toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between font-bold">
            <span className="text-zinc-300">Total</span>
            <span className="text-white">Q{order.total?.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {nextStatus && (
            <button
              onClick={() => onStatusChange(order._id || order.id, nextStatus)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {NEXT_LABEL[nextStatus]}
            </button>
          )}
          {order.status === 'entregado' && (
            <button
              onClick={handleDownloadInvoice}
              className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold py-3 rounded-xl border border-emerald-500/30 transition-colors"
            >
              📄 Descargar Factura
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default OrderDetailModal