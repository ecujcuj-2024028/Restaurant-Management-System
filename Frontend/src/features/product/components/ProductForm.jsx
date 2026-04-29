import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { ImagePlus } from 'lucide-react'
import useProductStore from '../store/productStore'
import useCategoryStore from '../../categories/store/categoryStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import Modal from '../../../shared/components/ui/Modal'

const getProductId = (product) => product?._id || product?.id

const getCategoryId = (cat) => {
    if (!cat) return ''
    if (typeof cat === 'object') return cat._id || cat.id || ''
    return cat
}

const getRestaurantId = (product) => {
    if (!product?.restaurant) return ''
    if (typeof product.restaurant === 'object') return product.restaurant._id || product.restaurant.id || ''
    return product.restaurant
}

const PRODUCT_TYPES = [
    { value: 'starter', label: 'Entrada' },
    { value: 'main', label: 'Plato principal' },
    { value: 'dessert', label: 'Postre' },
    { value: 'beverage', label: 'Bebida' },
    { value: 'side_dish', label: 'Acompañamiento' },
    { value: 'combo', label: 'Combo' },
]

const ProductForm = ({ productToEdit = null, onClose, onSuccess }) => {
    const isEditing = Boolean(productToEdit)

    const createProduct = useProductStore((state) => state.createProduct)
    const updateProduct = useProductStore((state) => state.updateProduct)

    const categories = useCategoryStore((state) => state.categories)
    const categoriesLoading = useCategoryStore((state) => state.loading)
    const fetchCategories = useCategoryStore((state) => state.fetchCategories)

    const restaurants = useRestaurantStore((state) => state.restaurants)
    const restaurantsLoading = useRestaurantStore((state) => state.loading)
    const fetchRestaurants = useRestaurantStore((state) => state.fetchRestaurants)

    const [imagePreview, setImagePreview] = useState(null)

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            restaurantId: '',
            categoryId: '',
            name: '',
            description: '',
            price: '',
            type: '',
            preparationTime: '',
        },
    })

    useEffect(() => {
        fetchCategories()
        fetchRestaurants()
    }, [fetchCategories, fetchRestaurants])

    useEffect(() => {
        if (productToEdit) {
            reset({
                restaurantId: getRestaurantId(productToEdit),
                categoryId: getCategoryId(productToEdit.category),
                name: productToEdit.name || '',
                description: productToEdit.description || '',
                price: productToEdit.price ?? '',
                type: productToEdit.type || '',
                preparationTime: productToEdit.preparationTime ?? '',
            })
            if (productToEdit.image) setImagePreview(productToEdit.image)
        }
    }, [productToEdit, reset])

    // Live image preview
    const imageFile = watch('image')
    useEffect(() => {
        if (imageFile && imageFile[0]) {
            const url = URL.createObjectURL(imageFile[0])
            setImagePreview(url)
            return () => URL.revokeObjectURL(url)
        }
    }, [imageFile])

    const onSubmit = async (data) => {
        const toastId = toast.loading(isEditing ? 'Actualizando producto...' : 'Creando producto...')
        try {
            const formData = new FormData()
            formData.append('restaurant', data.restaurantId)
            formData.append('category', data.categoryId)
            formData.append('name', data.name.trim())
            formData.append('description', data.description.trim())
            formData.append('price', data.price)
            formData.append('type', data.type)
            if (data.preparationTime) formData.append('preparationTime', data.preparationTime)
            if (data.image && data.image[0]) formData.append('image', data.image[0])

            if (isEditing) {
                const productId = getProductId(productToEdit)
                await updateProduct(productId, formData)
                toast.success('Producto actualizado correctamente', { id: toastId })
            } else {
                await createProduct(formData)
                toast.success('Producto creado correctamente', { id: toastId })
            }

            if (onSuccess) onSuccess()
            onClose()
        } catch (error) {
            const message = error?.message || 'Error al guardar el producto'
            toast.error(message, { id: toastId })
        }
    }

    return (
        <Modal
            title={isEditing ? 'Editar producto' : 'Nuevo producto'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pr-1">

                {/* Restaurante */}
                <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                        Restaurante *
                    </label>
                    <select
                        {...register('restaurantId', { required: 'El restaurante es requerido' })}
                        disabled={restaurantsLoading}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
                    >
                        <option value="" className="bg-zinc-900">
                            {restaurantsLoading ? 'Cargando restaurantes...' : 'Selecciona un restaurante'}
                        </option>
                        {restaurants.map((r) => (
                            <option key={r._id || r.id} value={r._id || r.id} className="bg-zinc-900">
                                {r.name}
                            </option>
                        ))}
                    </select>
                    {errors.restaurantId && (
                        <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.restaurantId.message}</p>
                    )}
                </div>

                {/* Nombre */}
                <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                        Nombre *
                    </label>
                    <input
                        {...register('name', {
                            required: 'El nombre es requerido',
                            minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                        })}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                        placeholder="Ej. Hamburguesa clásica"
                    />
                    {errors.name && (
                        <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.name.message}</p>
                    )}
                </div>

                {/* Descripción */}
                <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                        Descripción
                    </label>
                    <textarea
                        {...register('description', {
                            maxLength: { value: 500, message: 'Máximo 500 caracteres' },
                        })}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none placeholder:text-zinc-600"
                        placeholder="Describe brevemente este producto"
                        rows={3}
                    />
                    {errors.description && (
                        <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.description.message}</p>
                    )}
                </div>

                {/* Precio y Tiempo de preparación */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                            Precio (Q) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('price', {
                                required: 'El precio es requerido',
                                min: { value: 0, message: 'El precio debe ser positivo' },
                            })}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                            placeholder="0.00"
                        />
                        {errors.price && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.price.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                            Tiempo prep. (min)
                        </label>
                        <input
                            type="number"
                            min="1"
                            {...register('preparationTime', {
                                min: { value: 1, message: 'Mínimo 1 minuto' },
                            })}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                            placeholder="15"
                        />
                        {errors.preparationTime && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.preparationTime.message}</p>
                        )}
                    </div>
                </div>

                {/* Categoría y Tipo */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                            Categoría *
                        </label>
                        <select
                            {...register('categoryId', { required: 'La categoría es requerida' })}
                            disabled={categoriesLoading}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
                        >
                            <option value="" className="bg-zinc-900">
                                {categoriesLoading ? 'Cargando...' : 'Selecciona'}
                            </option>
                            {categories.map((cat) => (
                                <option key={cat._id || cat.id} value={cat._id || cat.id} className="bg-zinc-900">
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.categoryId && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.categoryId.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                            Tipo *
                        </label>
                        <select
                            {...register('type', { required: 'El tipo es requerido' })}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-zinc-900">Selecciona</option>
                            {PRODUCT_TYPES.map((t) => (
                                <option key={t.value} value={t.value} className="bg-zinc-900">
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.type.message}</p>
                        )}
                    </div>
                </div>

                {/* Imagen */}
                <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                        Imagen del producto
                    </label>
                    <label className="flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-2xl py-5 cursor-pointer transition-all bg-zinc-800/30 hover:bg-zinc-800/60">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-24 h-24 object-cover rounded-xl"
                            />
                        ) : (
                            <ImagePlus size={32} className="text-zinc-600" />
                        )}
                        <span className="text-zinc-500 text-xs">
                            {imagePreview ? 'Haz clic para cambiar la imagen' : 'Haz clic para subir una imagen'}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            {...register('image')}
                        />
                    </label>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl text-sm font-semibold transition-all"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting || categoriesLoading || restaurantsLoading}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? 'Guardando...'
                            : isEditing
                                ? 'Actualizar'
                                : 'Crear Producto'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default ProductForm