import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, MapPin, CreditCard, ShoppingBag, Truck, Save, Plus, Trash2, Utensils } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useExternalOrderStore from '../store/externalOrderStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useProductStore from '../../product/store/productStore'

const ExternalOrderForm = ({ onClose, onSuccess }) => {
  const { restaurants, fetchRestaurants } = useRestaurantStore()
  const { products, fetchProducts } = useProductStore()
  const createOrder = useExternalOrderStore(state => state.createOrder)

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      orderType: 'para_llevar',
      restaurantId: '',
      customerNote: '',
      deliveryAddress: { street: '', phone: '' },
      items: [{ productId: '', quantity: 1 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  })

  const currentOrderType = watch('orderType')
  const currentItems = watch('items')
  const selectedRestaurantId = watch('restaurantId')

  useEffect(() => {
    fetchRestaurants()
    fetchProducts()
  }, [fetchRestaurants, fetchProducts])

  // Calcular total localmente para mostrar en la UI
  const total = currentItems.reduce((acc, item) => {
    const product = products.find(p => (p._id || p.id) === item.productId)
    return acc + (product ? product.price * (parseInt(item.quantity) || 0) : 0)
  }, 0)

  const onSubmit = async (data) => {
    if (data.items.some(item => !item.productId)) {
      return toast.error('Selecciona un producto para cada línea')
    }

    const toastId = toast.loading('Registrando pedido...')
    try {
      const payload = {
        ...data,
        deliveryFee: data.orderType === 'domicilio' ? 15 : 0 
      }

      const newOrder = await createOrder(payload)
      toast.success('Pedido registrado con éxito', { id: toastId })
      if (onSuccess) onSuccess(newOrder)
      onClose()
    } catch (error) {
      toast.error(error.message || 'Error al crear el pedido', { id: toastId })
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-white">Nuevo Pedido Externo</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Gestión de Inventario Activa</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Restaurante y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Restaurante de Origen</label>
              <select 
                {...register('restaurantId', { required: 'Selecciona un restaurante' })}
                className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer"
              >
                <option value="">Seleccionar...</option>
                {restaurants.map(r => (
                  <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Tipo de Servicio</label>
              <div className="flex gap-2 p-1 bg-zinc-800/50 rounded-2xl border border-white/5">
                <button 
                  type="button"
                  onClick={() => setValue('orderType', 'para_llevar')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${currentOrderType === 'para_llevar' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  <ShoppingBag size={14} /> Para Llevar
                </button>
                <button 
                  type="button"
                  onClick={() => setValue('orderType', 'domicilio')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${currentOrderType === 'domicilio' ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Truck size={14} /> Domicilio
                </button>
              </div>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Nombre del Cliente</label>
              <input 
                {...register('deliveryAddress.phone', { required: 'Teléfono es obligatorio' })}
                placeholder="Teléfono de contacto"
                className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
              />
            </div>
            {currentOrderType === 'domicilio' && (
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Dirección exacta</label>
                <input 
                  {...register('deliveryAddress.street', { required: currentOrderType === 'domicilio' })}
                  placeholder="Calle, zona, casa..."
                  className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>
            )}
          </div>

          {/* Selección de Productos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-2">Productos del Pedido</label>
              <button 
                type="button" onClick={() => append({ productId: '', quantity: 1 })}
                className="text-orange-500 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-orange-500/10 px-3 py-1 rounded-lg transition-all"
              >
                <Plus size={14} /> Añadir Producto
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <select 
                      {...register(`items.${index}.productId`, { required: true })}
                      className="w-full bg-zinc-800/30 border border-white/5 rounded-xl py-3 px-3 text-sm text-white focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none"
                    >
                      <option value="">Seleccionar Producto...</option>
                      {products.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>{p.name} (Q{p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 space-y-1">
                    <input 
                      type="number" min="1"
                      {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                      className="w-full bg-zinc-800/30 border border-white/5 rounded-xl py-3 px-3 text-sm text-white text-center"
                    />
                  </div>
                  {fields.length > 1 && (
                    <button 
                      type="button" onClick={() => remove(index)}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resumen Final */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Estimado</p>
              <p className="text-3xl font-black text-orange-500">Q {total.toFixed(2)}</p>
            </div>
            <button
              type="submit" disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-[2rem] font-black shadow-xl shadow-orange-500/20 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={20} />
              Confirmar Pedido
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default ExternalOrderForm
