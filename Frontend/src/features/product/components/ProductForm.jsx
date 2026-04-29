import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { ImagePlus, Plus, Trash2, Info, Loader2 } from 'lucide-react'
import useProductStore from '../store/productStore'
import useCategoryStore from '../../categories/store/categoryStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useInventoryStore from '../../inventory/store/inventoryStore'
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
    const fetchCategories = useCategoryStore((state) => state.fetchCategories)

    const restaurants = useRestaurantStore((state) => state.restaurants)
    const fetchRestaurants = useRestaurantStore((state) => state.fetchRestaurants)

    const { items: inventory, fetchInventory } = useInventoryStore()

    const [imagePreview, setImagePreview] = useState(null)
    const [initialLoading, setInitialLoading] = useState(true)

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            restaurantId: '',
            categoryId: '',
            name: '',
            description: '',
            price: '',
            type: 'main',
            preparationTime: '',
            ingredients: []
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "ingredients"
    })

    const selectedRestaurantId = watch('restaurantId')

    // Filtrar solo insumos base (sin MongoProductId) para que no salgan platos terminados como ingredientes
    const baseIngredients = inventory.filter(item => !item.MongoProductId)

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Cargar categorías y restaurantes primero
                await Promise.all([fetchCategories(), fetchRestaurants()])
                
                // Si estamos editando, cargar el inventario del restaurante del producto ANTES de quitar el loading
                if (productToEdit) {
                    const restId = getRestaurantId(productToEdit)
                    if (restId) {
                        await fetchInventory(restId)
                    }
                }
            } finally {
                setInitialLoading(false)
            }
        }
        loadInitialData()
    }, [fetchCategories, fetchRestaurants, productToEdit, fetchInventory])

    // Mantener el inventario actualizado si el usuario cambia de restaurante manualmente
    useEffect(() => {
        if (!initialLoading && selectedRestaurantId) {
            fetchInventory(selectedRestaurantId)
        }
    }, [selectedRestaurantId, fetchInventory, initialLoading])

    useEffect(() => {
        if (!initialLoading && productToEdit) {
            reset({
                restaurantId: getRestaurantId(productToEdit),
                categoryId: getCategoryId(productToEdit.category),
                name: productToEdit.name || '',
                description: productToEdit.description || '',
                price: productToEdit.price ?? '',
                type: productToEdit.type || 'main',
                preparationTime: productToEdit.preparationTime ?? '',
                ingredients: productToEdit.ingredients || []
            })
            if (productToEdit.image) setImagePreview(productToEdit.image)
        }
    }, [productToEdit, initialLoading, reset])

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
            
            // Si el array está vacío, enviamos un array vacío stringificado
            const ingredientsData = Array.isArray(data.ingredients) && data.ingredients.length > 0 
                ? JSON.stringify(data.ingredients) 
                : "[]"
            
            formData.append('ingredients', ingredientsData)

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
            const message = error?.response?.data?.message || error?.message || 'Error al guardar el producto'
            toast.error(message, { id: toastId })
        }
    }

    return (
        <Modal
            title={isEditing ? 'Editar producto' : 'Nuevo producto'}
            onClose={onClose}
        >
            {initialLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                    <p className="text-zinc-500 text-sm font-medium">Cargando información necesaria...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Sección: Información Básica */}
                    <div className="space-y-4">
                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">Información General</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">Restaurante *</label>
                                <select
                                    {...register('restaurantId', { required: 'Requerido' })}
                                    className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="">Selecciona...</option>
                                    {restaurants.map((r) => (
                                        <option key={r._id || r.id} value={r._id || r.id} className="bg-zinc-900">{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">Categoría *</label>
                                <select
                                    {...register('categoryId', { required: 'Requerido' })}
                                    className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="">Selecciona...</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id || cat.id} value={cat._id || cat.id} className="bg-zinc-900">{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">Nombre del Producto *</label>
                            <input
                                {...register('name', { required: 'El nombre es requerido' })}
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                                placeholder="Ej. Hamburguesa Doble Queso"
                            />
                        </div>

                        <div>
                            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">Descripción</label>
                            <textarea
                                {...register('description')}
                                rows="3"
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600 resize-none"
                                placeholder="Describe los ingredientes, sabor o presentación del plato..."
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">Precio (Q) *</label>
                                <input type="number" step="0.01" {...register('price', { required: true })} className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">Tipo *</label>
                                <select {...register('type', { required: true })} className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none">
                                    {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">Tiempo (min)</label>
                                <input type="number" {...register('preparationTime')} className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                            </div>
                        </div>
                    </div>

                    {/* Sección: Ingredientes (Basado en Inventario) */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Ingredientes y Receta</h3>
                            <button
                                type="button"
                                onClick={() => append({ name: '', quantity: '1', unit: 'unidades', isAllergen: false })}
                                disabled={!selectedRestaurantId}
                                className="flex items-center gap-1 text-orange-500 text-[10px] font-bold uppercase hover:text-orange-400 disabled:opacity-30 transition-colors"
                            >
                                <Plus size={14} /> Añadir Ingrediente
                            </button>
                        </div>

                        {!selectedRestaurantId && (
                            <div className="flex items-center gap-2 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-orange-500/80 text-xs">
                                <Info size={16} />
                                <span>Selecciona un restaurante primero para cargar el inventario.</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-zinc-800/20 p-3 rounded-2xl border border-zinc-800/50">
                                    <div className="col-span-5">
                                        <label className="text-zinc-500 text-[9px] uppercase mb-1 block">Insumo</label>
                                        <select
                                            {...register(`ingredients.${index}.name`, { 
                                                required: true,
                                                onChange: (e) => {
                                                    const selectedName = e.target.value;
                                                    const inventoryItem = baseIngredients.find(item => (item.Name || item.name) === selectedName);
                                                    if (inventoryItem) {
                                                        const unit = inventoryItem.Unit || inventoryItem.unit || 'unidades';
                                                        setValue(`ingredients.${index}.unit`, unit);
                                                    }
                                                }
                                            })}
                                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 appearance-none"
                                        >
                                            <option value="">Selecciona...</option>
                                            {baseIngredients.map(item => (
                                                <option key={item.id || item._id} value={item.Name || item.name}>
                                                    {item.Name || item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-zinc-500 text-[9px] uppercase mb-1 block">Cant.</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            {...register(`ingredients.${index}.quantity`, { required: true })}
                                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-zinc-500 text-[9px] uppercase mb-1 block">Unidad</label>
                                        <select
                                            {...register(`ingredients.${index}.unit`)}
                                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 appearance-none"
                                        >
                                            <option value="unidades">Unid.</option>
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                            <option value="l">l</option>
                                            <option value="ml">ml</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 flex flex-col items-center justify-center">
                                        <label className="text-zinc-500 text-[9px] uppercase mb-1 block text-center">Alérgeno</label>
                                        <input
                                            type="checkbox"
                                            {...register(`ingredients.${index}.isAllergen`)}
                                            className="w-5 h-5 rounded-md border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500/50 cursor-pointer"
                                        />
                                    </div>
                                    <div className="col-span-1 pb-1 text-right">
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sección: Imagen */}
                    <div className="space-y-4">
                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">Imagen de Portada</h3>
                        <label className="flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-3xl py-8 cursor-pointer transition-all bg-zinc-800/20">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-2xl shadow-xl ring-2 ring-zinc-700" />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                                    <ImagePlus size={32} />
                                </div>
                            )}
                            <span className="text-zinc-500 text-xs font-medium">
                                {imagePreview ? 'Cambiar imagen del producto' : 'Subir imagen del producto'}
                            </span>
                            <input type="file" accept="image/*" className="hidden" {...register('image')} />
                        </label>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-4 pt-6 border-t border-zinc-800">
                        <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl text-sm font-semibold transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50">
                            {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Producto')}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    )
}

export default ProductForm
