import { getInvoice } from '../../../shared/api/orders'
import { toast } from 'react-hot-toast'
import { ChefHat, Bell, CheckCircle2, Mail, X } from 'lucide-react'
import OrderStatusBadge from './OrderStatusBadge'
import Modal from '../../../shared/components/ui/Modal'

const OrderDetailModal = ({ order, onClose, onStatusChange, isClient }) => {
  if (!order) return null

  const STATUS_FLOW = {
    recibido: 'en_preparacion',
    en_preparacion: 'listo',
    listo: 'entregado',
  }

  const nextStatus = STATUS_FLOW[order.status]

  const NEXT_CONFIG = {
    en_preparacion: { label: 'Comenzar Preparación', icon: ChefHat },
    listo: { label: 'Marcar como Listo', icon: Bell },
    entregado: { label: 'Marcar como Entregado', icon: CheckCircle2 },
  }

  const handleDownloadInvoice = async () => {
    const toastId = toast.loading('Generando factura...')
    try {
      await getInvoice(order._id || order.id)
      toast.success('Factura enviada a tu correo electrónico', { id: toastId })
    } catch {
      toast.error('Error al generar la factura', { id: toastId })
    }
  }

  return (
    <Modal title={`Pedido #${(order._id || order.id)?.slice(-6).toUpperCase()}`} onClose={onClose}>
      <div className="space-y-6">

        <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="space-y-1">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Estado Actual</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="text-right space-y-1">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Ubicación</p>
            <span className="text-white font-bold text-sm">Mesa #{order.tableNumber}</span>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-white/5 rounded-2xl p-5 space-y-4">
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-2">Resumen de Productos</p>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-white font-bold">{item.name}</span>
                  <span className="text-zinc-500 text-[10px]">Precio Unitario: Q{item.price?.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-orange-500 font-black px-2 py-1 bg-orange-500/10 rounded-lg text-[10px]">x{item.quantity}</span>
                  <span className="text-white font-black">Q{item.subtotal?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center">
            <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Total del Pedido</span>
            <span className="text-orange-500 font-black text-lg underline decoration-orange-500/30 underline-offset-4">Q{order.total?.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {!isClient && nextStatus && (
            <button
              onClick={() => onStatusChange(order._id || order.id, nextStatus)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {(() => {
                const Icon = NEXT_CONFIG[nextStatus].icon
                return <><Icon size={18} /> {NEXT_CONFIG[nextStatus].label}</>
              })()}
            </button>
          )}
          
          {order.status === 'entregado' && (
            <button
              onClick={handleDownloadInvoice}
              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-black py-4 rounded-2xl border border-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Mail size={18} /> Enviar factura al correo
            </button>
          )}

          <button 
            onClick={onClose}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-2"
          >
            <X size={14} /> Cerrar Ventana
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default OrderDetailModal