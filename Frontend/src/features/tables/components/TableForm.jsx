import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import useTableStore from '../store/tableStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import Modal from '../../../shared/components/ui/Modal'

const getTableId = (table) => table?._id || table?.id

const getRestaurantId = (table) => {
    if (!table?.restaurant) return ''

    if (typeof table.restaurant === 'object') {
        return table.restaurant._id || table.restaurant.id || ''
    }

    return table.restaurant
}

const TableForm = ({ tableToEdit = null, onClose, onSuccess }) => {
    const isEditing = Boolean(tableToEdit)

    const createTable = useTableStore((state) => state.createTable)
    const updateTable = useTableStore((state) => state.updateTable)

    const restaurants = useRestaurantStore((state) => state.restaurants)
    const restaurantsLoading = useRestaurantStore((state) => state.loading)
    const restaurantsError = useRestaurantStore((state) => state.error)
    const fetchRestaurants = useRestaurantStore((state) => state.fetchRestaurants)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            restaurant: '',
            number: '',
            capacity: '',
            location: 'interior',
            availability: 'disponible',
        },
    })

    useEffect(() => {
        fetchRestaurants()
    }, [fetchRestaurants])

    useEffect(() => {
        if (tableToEdit) {
            reset({
                restaurant: getRestaurantId(tableToEdit),
                number: tableToEdit.number || '',
                capacity: tableToEdit.capacity || '',
                location: tableToEdit.location || 'interior',
                availability: tableToEdit.availability || 'disponible',
            })
        }
    }, [tableToEdit, reset])

    const onSubmit = async (data) => {
        const toastId = toast.loading(isEditing ? 'Actualizando mesa...' : 'Creando mesa...')
        try {
            const payload = {
                restaurant: data.restaurant,
                number: Number(data.number),
                capacity: Number(data.capacity),
                location: data.location,
                availability: data.availability,
            }

            if (isEditing) {
                const tableId = getTableId(tableToEdit)
                await updateTable(tableId, payload)
                toast.success('Mesa actualizada correctamente', { id: toastId })
            } else {
                await createTable(payload)
                toast.success('Mesa creada correctamente', { id: toastId })
            }

            if (onSuccess) onSuccess()
            onClose()
        } catch (error) {
            const message = error?.message || 'Error al guardar la mesa'
            toast.error(message, { id: toastId })
        }
    }

    return (
        <Modal
            title={isEditing ? 'Editar mesa' : 'Nueva mesa'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Restaurante */}
                <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                        Restaurante *
                    </label>

                    <select
                        {...register('restaurant', {
                            required: 'El restaurante es requerido',
                        })}
                        disabled={restaurantsLoading}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
                    >
                        <option value="" className="bg-zinc-900">
                            {restaurantsLoading
                                ? 'Cargando restaurantes...'
                                : 'Selecciona un restaurante'}
                        </option>

                        {restaurants.map((restaurant) => (
                            <option
                                key={restaurant._id || restaurant.id}
                                value={restaurant._id || restaurant.id}
                                className="bg-zinc-900"
                            >
                                {restaurant.name}
                            </option>
                        ))}
                    </select>

                    {errors.restaurant && (
                        <p className="text-red-400 text-xs mt-1.5 ml-1">
                            {errors.restaurant.message}
                        </p>
                    )}

                    {restaurantsError && (
                        <p className="text-red-400 text-xs mt-1.5 ml-1">
                            Error al cargar restaurantes: {restaurantsError}
                        </p>
                    )}
                </div>

                {/* Número de mesa y Capacidad en fila */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                            Número de Mesa *
                        </label>

                        <input
                            type="number"
                            {...register('number', {
                                required: 'El número de mesa es requerido',
                                min: {
                                    value: 1,
                                    message: 'El número debe ser al menos 1',
                                },
                                max: {
                                    value: 9999,
                                    message: 'El número no puede exceder 9999',
                                },
                            })}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                            placeholder="Ej. 1"
                        />

                        {errors.number && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1">
                                {errors.number.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                            Capacidad *
                        </label>

                        <input
                            type="number"
                            {...register('capacity', {
                                required: 'La capacidad es requerida',
                                min: {
                                    value: 1,
                                    message: 'La capacidad mínima es 1',
                                },
                                max: {
                                    value: 50,
                                    message: 'La capacidad no puede exceder 50',
                                },
                            })}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                            placeholder="Ej. 4"
                        />

                        {errors.capacity && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1">
                                {errors.capacity.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Ubicación */}
                <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                        Ubicación
                    </label>

                    <select
                        {...register('location')}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="interior" className="bg-zinc-900">Interior</option>
                        <option value="exterior" className="bg-zinc-900">Exterior</option>
                        <option value="terraza" className="bg-zinc-900">Terraza</option>
                        <option value="vip" className="bg-zinc-900">VIP</option>
                    </select>
                </div>

                {/* Disponibilidad (solo en edición) */}
                {isEditing && (
                    <div>
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                            Disponibilidad
                        </label>

                        <select
                            {...register('availability')}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="disponible" className="bg-zinc-900">Disponible</option>
                            <option value="ocupado" className="bg-zinc-900">Ocupada</option>
                            <option value="reservado" className="bg-zinc-900">Reservada</option>
                        </select>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl text-sm font-semibold transition-all"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting || restaurantsLoading}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? 'Guardando...'
                            : isEditing
                                ? 'Actualizar'
                                : 'Crear Mesa'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default TableForm