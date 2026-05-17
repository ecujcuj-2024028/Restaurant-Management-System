import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Trash2, Plus, ShoppingBag, ImageOff, Store } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useProductStore from '../store/productStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import ProductForm from './ProductForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const getProductId = (product) => product?._id || product?.id

const ProductList = () => {
    const {
        products,
        loading,
        error,
        fetchProducts,
        deleteProduct,
    } = useProductStore()

    const { restaurants, fetchRestaurants } = useRestaurantStore()

    const [showForm, setShowForm] = useState(false)
    const [productToEdit, setProductToEdit] = useState(null)
    const [productToDelete, setProductToDelete] = useState(null)
    const [selectedRestaurant, setSelectedRestaurant] = useState('')

    useEffect(() => {
        fetchRestaurants()
    }, [fetchRestaurants])

    useEffect(() => {
        const params = {}
        if (selectedRestaurant) params.restaurant = selectedRestaurant
        fetchProducts(params)
    }, [selectedRestaurant, fetchProducts])

    const openCreateForm = () => {
        setProductToEdit(null)
        setShowForm(true)
    }

    const openEditForm = (product) => {
        setProductToEdit(product)
        setShowForm(true)
    }

    const closeForm = () => {
        setProductToEdit(null)
        setShowForm(false)
    }

    const handleDelete = async () => {
        const toastId = toast.loading('Eliminando producto...')
        try {
            const productId = getProductId(productToDelete)
            await deleteProduct(productId)
            setProductToDelete(null)
            toast.success('Producto eliminado correctamente', { id: toastId })
        } catch (error) {
            toast.error(error?.message || 'Error al eliminar el producto', { id: toastId })
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-10"
        >
            {showForm && (
                <ProductForm
                    productToEdit={productToEdit}
                    onClose={closeForm}
                    onSuccess={() => {
                        const params = {}
                        if (selectedRestaurant) params.restaurant = selectedRestaurant
                        fetchProducts(params)
                    }}
                />
            )}

            {productToDelete && (
                <ConfirmDialog
                    message={`Esta acción eliminará el producto "${productToDelete.name}" permanentemente.`}
                    onConfirm={handleDelete}
                    onCancel={() => setProductToDelete(null)}
                />
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Productos</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Administra los productos del menú de tu restaurante.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Store size={18} />
                        </div>
                        <select
                            value={selectedRestaurant}
                            onChange={(e) => setSelectedRestaurant(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/10 text-white pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none transition-all"
                        >
                            <option value="">Todos los restaurantes</option>
                            {restaurants.map((res) => (
                                <option key={res.id || res._id} value={res.id || res._id}>
                                    {res.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={openCreateForm}
                        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Producto</th>
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Categoría</th>
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Precio</th>
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Estado</th>
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                            {loading && products.length === 0 ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}>
                                        <td className="px-8 py-5"><Skeleton className="h-12 w-48 rounded-xl" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                        <td className="px-8 py-5 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-zinc-500 py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-zinc-800 rounded-full">
                                                <ShoppingBag size={40} className="opacity-20" />
                                            </div>
                                            <p className="font-medium">No hay productos registrados aún.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {products.map((product, index) => {
                                        const productId = getProductId(product)
                                        const isAvailable = product.isAvailable !== false
                                        const categoryName =
                                            typeof product.category === 'object'
                                                ? product.category?.name
                                                : product.category

                                        return (
                                            <motion.tr 
                                                key={productId}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="hover:bg-white/5 transition-colors group"
                                            >
                                                {/* Imagen + Nombre */}
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-white/5 group-hover:border-orange-500/30 transition-colors">
                                                            {product.image ? (
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                                />
                                                            ) : (
                                                                <ImageOff size={20} className="text-zinc-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">
                                                                {product.name}
                                                            </p>
                                                            {product.description && (
                                                                <p className="text-zinc-500 text-[10px] mt-0.5 line-clamp-1 italic font-medium">
                                                                    {product.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Categoría */}
                                                <td className="px-8 py-5">
                                                    <span className="text-zinc-300 text-xs font-bold bg-zinc-800/50 px-3 py-1 rounded-lg border border-white/5">
                                                        {categoryName || '—'}
                                                    </span>
                                                </td>

                                                {/* Precio */}
                                                <td className="px-8 py-5">
                                                    <span className="text-orange-400 font-black text-sm">
                                                        Q {Number(product.price).toFixed(2)}
                                                    </span>
                                                </td>

                                                {/* Estado */}
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${isAvailable ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20' : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20'}`}>
                                                        {isAvailable ? 'Disponible' : 'No disponible'}
                                                    </span>
                                                </td>

                                                {/* Acciones */}
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditForm(product)}
                                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>

                                                        <button
                                                            onClick={() => setProductToDelete(product)}
                                                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )
                                    })}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {loading && products.length > 0 && (
                <div className="mt-6 flex justify-center">
                   <Skeleton className="h-2 w-full max-w-md rounded-full" />
                </div>
            )}
        </motion.div>
    )
}

export default ProductList