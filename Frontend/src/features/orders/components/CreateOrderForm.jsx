import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import useOrderStore from '../store/orderStore'
import api from '../../../shared/api/api'
import Modal from '../../../shared/components/ui/Modal'

const CreateOrderForm = ({ restaurantId, onClose, initialItems = [] }) => {
  const [tables, setTables] = useState([])
  const [products, setProducts] = useState([])
  const [selectedTable, setSelectedTable] = useState('')
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState(true)
  const { createOrder } = useOrderStore()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesRes, productsRes] = await Promise.all([
          api.get(`/tables?restaurantId=${restaurantId}&onlyActiveReservation=true`),
          api.get(`/products?restaurant=${restaurantId}`)
        ])
        setTables(tablesRes.data?.tables || tablesRes.data || [])
        setProducts(productsRes.data?.products || productsRes.data || [])
      } catch (error) {
        toast.error('Error al cargar datos del restaurante')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [restaurantId])

  const handleAddProduct = (product) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.productId === (product._id || product.id))
      if (exists) {
        return prev.map((i) =>
          i.productId === (product._id || product.id)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, {
        productId: product._id || product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]
    })
  }

  const handleRemoveProduct = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return handleRemoveProduct(productId)
    setItems((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, quantity } : i)
    )
  }

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)

const handleSubmit = async () => {
  if (!selectedTable) return toast.error('Selecciona una mesa')
  if (items.length === 0) return toast.error('Agrega al menos un producto')

  const toastId = toast.loading('Creando pedido...')
  try {
    await createOrder({
      restaurantId,
      tableId: selectedTable,
      tableNumber: tables.find(t => (t._id || t.id) === selectedTable)?.number || 
                   tables.find(t => (t._id || t.id) === selectedTable)?.tableNumber,
      items: items.map((i) => ({ 
        productId: i.productId,
        quantity: i.quantity,
        isMenu: i.isMenu || false
      }))
    })
    
    toast.success((t) => (
      <div className="flex items-center justify-between gap-4 w-full">
        <span>¡Pedido creado exitosamente!</span>
        <button 
          onClick={() => toast.dismiss(t.id)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <XCircle size={14} className="text-zinc-500" />
        </button>
      </div>
    ), { id: toastId, duration: 6000 })

    onClose()
    navigate('/my-orders')
  } catch (error) {
    const message = error?.response?.data?.message || 'Error al crear el pedido'
    toast.error((t) => (
      <div className="flex items-center justify-between gap-4 w-full">
        <span>{message}</span>
        <button onClick={() => toast.dismiss(t.id)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <XCircle size={14} className="text-zinc-500" />
        </button>
      </div>
    ), { id: toastId })
  }
}

  return (
    <Modal title="Hacer un pedido" onClose={onClose}>
      {loading ? (
        <div className="text-center py-10 text-zinc-400">Cargando...</div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Selecciona una mesa
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {tables.length === 0 ? (
                <option value="">No tienes reservación activa</option>
              ) : (
                <>
                  <option value="">-- Selecciona una mesa --</option>
                  {tables.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      Mesa #{t.number || t.tableNumber} — Cap. {t.capacity}
                    </option>
                  ))}
                </>
              )}
            </select>          </div>

          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Productos disponibles
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {products.length === 0 ? (
                <p className="text-zinc-500 text-sm">No hay productos disponibles</p>
              ) : (
                products.map((product) => (
                  <div
                    key={product._id || product.id}
                    className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{product.name}</p>
                      <p className="text-zinc-400 text-xs">Q{product.price?.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleAddProduct(product)}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Tu pedido
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-zinc-400 text-xs">Q{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        className="w-7 h-7 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
                      >
                        −
                      </button>
                      <span className="text-white text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        className="w-7 h-7 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-700">
                <span className="text-zinc-400 text-sm">Total</span>
                <span className="text-white font-bold">Q{total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || !selectedTable}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            Confirmar Pedido
          </button>
        </div>
      )}
    </Modal>
  )
}

export default CreateOrderForm