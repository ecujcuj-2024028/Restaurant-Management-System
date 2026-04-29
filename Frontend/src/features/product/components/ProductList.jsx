import { useEffect, useState } from 'react'
import { Edit3, Trash2, Plus, ShoppingBag, ImageOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useProductStore from '../store/productStore'
import ProductForm from './ProductForm'
import Spinner from '../../../shared/components/layout/Spinner'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const getProductId = (product) => product?._id || product?.id

const PRODUCT_TYPE_LABELS = {
    starter: 'Entrada',
    main: 'Plato principal',
    dessert: 'Postre',
    beverage: 'Bebida',
    side_dish: 'Acompañamiento',
    combo: 'Combo',
}

const ProductList = () => {
    const {
        products,
        loading,
        error,
        fetchProducts,
        deleteProduct,
    } = useProductStore()

    const [showForm, setShowForm] = useState(false)
    const [productToEdit, setProductToEdit] = useState(null)
    const [productToDelete, setProductToDelete] = useState(null)

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

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

    if (loading && products.length === 0) return <Spinner />

    return (
        <div className="animate-in fade-in duration-500">
            {showForm && (
                <ProductForm
                    productToEdit={productToEdit}
                    onClose={closeForm}
                    onSuccess={fetchProducts}
                />
            )}

            {productToDelete && (
                <ConfirmDialog
                    message={`Esta acción eliminará el producto "${productToDelete.name}" permanentemente.`}
                    onConfirm={handleDelete}
                    onCancel={() => setProductToDelete(null)}
                />
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Productos</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Administra los productos del menú de tu restaurante.
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nuevo Producto
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full">
                    <thead>
                        <tr className="bg-zinc-800/50 border-b border-zinc-800">
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Producto</th>
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Categoría</th>
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Tipo</th>
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Precio</th>
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Estado</th>
                            <th className="text-right text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-zinc-500 py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <ShoppingBag size={40} className="text-zinc-700" />
                                        <p>No hay productos registrados aún.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => {
                                const productId = getProductId(product)
                                const isAvailable = product.isAvailable !== false
                                const categoryName =
                                    typeof product.category === 'object'
                                        ? product.category?.name
                                        : product.category

                                return (
                                    <tr key={productId} className="hover:bg-zinc-800/30 transition-colors group">
                                        {/* Imagen + Nombre */}
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
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
                                                        <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1 italic">
                                                            {product.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Categoría */}
                                        <td className="px-8 py-5">
                                            <span className="text-zinc-300 text-sm">
                                                {categoryName || '—'}
                                            </span>
                                        </td>

                                        {/* Tipo */}
                                        <td className="px-8 py-5">
                                            <span className="text-zinc-400 text-xs">
                                                {PRODUCT_TYPE_LABELS[product.type] || product.type || '—'}
                                            </span>
                                        </td>

                                        {/* Precio */}
                                        <td className="px-8 py-5">
                                            <span className="text-orange-400 font-bold text-sm">
                                                Q{Number(product.price).toFixed(2)}
                                            </span>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isAvailable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {isAvailable ? 'Disponible' : 'No disponible'}
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditForm(product)}
                                                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit3 size={18} />
                                                </button>

                                                <button
                                                    onClick={() => setProductToDelete(product)}
                                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {loading && products.length > 0 && (
                <div className="mt-6 flex justify-center">
                    <Spinner />
                </div>
            )}
        </div>
    )
}

export default ProductList