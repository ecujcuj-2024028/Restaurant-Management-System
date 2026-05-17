// src/features/menu/components/MenuForm.jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Check, X, Search } from 'lucide-react'
import useMenuStore from '../store/menuStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useProductStore from '../../product/store/productStore'
import Modal from '../../../shared/components/ui/Modal'

const MenuForm = ({ menuToEdit = null, onClose, onSuccess }) => {
    const isEditing = Boolean(menuToEdit)
    const { createMenu, updateMenu } = useMenuStore()
    const { restaurants, fetchRestaurants } = useRestaurantStore()
    const { products, fetchProducts } = useProductStore()

    const [selectedProducts, setSelectedProducts] = useState([])
    const [searchTerm, setSearchSearchTerm] = useState('')

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            name: '',
            description: '',
            restaurant: '',
            menuType: 'all_day',
            validFrom: '',
            validTo: ''
        }
    })

    const restaurantId = watch('restaurant')

    useEffect(() => {
        fetchRestaurants()
    }, [fetchRestaurants])

    useEffect(() => {
        if (restaurantId) {
            fetchProducts({ restaurant: restaurantId })
        }
    }, [restaurantId, fetchProducts])

    useEffect(() => {
        if (menuToEdit) {
            reset({
                name: menuToEdit.name || '',
                description: menuToEdit.description || '',
                restaurant: menuToEdit.restaurant?._id || menuToEdit.restaurant || '',
                menuType: menuToEdit.menuType || 'all_day',
                validFrom: menuToEdit.validFrom ? menuToEdit.validFrom.split('T')[0] : '',
                validTo: menuToEdit.validTo ? menuToEdit.validTo.split('T')[0] : ''
            })
            // Extraer IDs de productos si ya tiene items
            const initialIds = menuToEdit.items?.map(i => i.product?._id || i.product) || []
            setSelectedProducts(initialIds)
        }
    }, [menuToEdit, reset])

    const toggleProduct = (productId) => {
        setSelectedProducts(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const onSubmit = async (data) => {
        if (selectedProducts.length === 0) {
            return toast.error('Debes seleccionar al menos un producto para el menú')
        }

        const toastId = toast.loading(isEditing ? 'Actualizando menú...' : 'Creando menú...')

        try {
            const payload = {
                ...data,
                price: data.price ? Number(data.price) : null,
                restaurantId: data.restaurant,
                items: selectedProducts.map(id => ({ product: id }))
            }

            if (isEditing) {
                await updateMenu(menuToEdit._id || menuToEdit.id, payload)
                toast.success('Menú actualizado correctamente', { id: toastId })
            } else {
                await createMenu(payload)
                toast.success('Menú creado correctamente', { id: toastId })
            }

            onSuccess?.()
            onClose()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al guardar el menú', { id: toastId })
        }
    }

    const calculateAutoPrice = () => {
        const total = products
            .filter(p => selectedProducts.includes(p._id || p.id))
            .reduce((sum, p) => sum + (Number(p.price) || 0), 0)
        
        reset({ ...watch(), price: total.toFixed(2) })
        toast.success(`Precio calculado: Q${total.toFixed(2)}`)
    }

    return (
        <Modal title={isEditing ? 'Editar Menú' : 'Nuevo Menú'} onClose={onClose}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Nombre del Menú *</label>
                        <input
                            {...register('name', { required: 'El nombre es requerido' })}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Ej: Menú de Almuerzos"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Descripción</label>
                        <textarea
                            {...register('description')}
                            rows={2}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Breve descripción de lo que incluye..."
                        />
                    </div>

                    <div>
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Restaurante *</label>
                        <select 
                            {...register('restaurant', { required: 'El restaurante es requerido' })} 
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white"
                            disabled={isEditing}
                        >
                            <option value="">Seleccionar Sede</option>
                            {restaurants.map(r => (
                                <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Tipo *</label>
                        <select {...register('menuType')} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white">
                            <option value="breakfast">Desayuno</option>
                            <option value="lunch">Almuerzo</option>
                            <option value="dinner">Cena</option>
                            <option value="all_day">Todo el día</option>
                            <option value="special">Especial</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Precio del Menú (Opcional)</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">Q</span>
                            <input
                                type="number"
                                step="0.01"
                                {...register('price')}
                                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl pl-10 pr-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={calculateAutoPrice}
                        disabled={selectedProducts.length === 0}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                    >
                        Sumar selección
                    </button>
                </div>

                {/* SECCIÓN DE PRODUCTOS */}
                <div className="space-y-4 border-t border-white/5 pt-6">
                    <div className="flex items-center justify-between">
                        <label className="text-white text-sm font-black uppercase tracking-tight">Productos del Menú ({selectedProducts.length})</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchSearchTerm(e.target.value)}
                                placeholder="Buscar plato..."
                                className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:ring-1 focus:ring-orange-500 outline-none w-40"
                            />
                        </div>
                    </div>

                    {!restaurantId ? (
                        <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 text-center">
                            <p className="text-orange-500/60 text-xs font-medium">Primero selecciona un restaurante para ver sus productos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredProducts.map(product => {
                                const isSelected = selectedProducts.includes(product._id || product.id)
                                return (
                                    <button
                                        key={product._id || product.id}
                                        type="button"
                                        onClick={() => toggleProduct(product._id || product.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                            isSelected 
                                                ? 'bg-orange-500/10 border-orange-500 text-white' 
                                                : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                                            isSelected ? 'bg-orange-500' : 'bg-zinc-800 border border-zinc-700'
                                        }`}>
                                            {isSelected && <Check size={12} className="text-white stroke-[4]" />}
                                        </div>
                                        <span className="text-xs font-bold truncate">{product.name}</span>
                                        <span className="ml-auto text-[10px] font-black text-orange-500/80">Q{product.price}</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-2 border-t border-white/5 pt-6">
                    <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl font-semibold transition-colors text-white text-sm">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-black disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20 text-white text-sm"
                    >
                        {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Menú'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default MenuForm