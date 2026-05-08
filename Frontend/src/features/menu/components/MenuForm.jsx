// src/features/menu/components/MenuForm.jsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import useMenuStore from '../store/menuStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import Modal from '../../../shared/components/ui/Modal'

const MenuForm = ({ menuToEdit = null, onClose, onSuccess }) => {
    const isEditing = Boolean(menuToEdit)
    const { createMenu, updateMenu } = useMenuStore()
    const { restaurants, fetchRestaurants } = useRestaurantStore()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            name: '',
            description: '',
            restaurant: '',
            menuType: 'all_day',     // ← debe coincidir con el backend
            validFrom: '',
            validTo: ''
        }
    })

    useEffect(() => {
        fetchRestaurants()
    }, [fetchRestaurants])

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
        }
    }, [menuToEdit, reset])

const onSubmit = async (data) => {
    const toastId = toast.loading(isEditing ? 'Actualizando menú...' : 'Creando menú...')

    try {
        const payload = {
            name: data.name,
            description: data.description,
            restaurantId: data.restaurant,
            menuType: data.menuType,
            validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : null,
            validTo: data.validTo ? new Date(data.validTo).toISOString() : null,

            products: menuToEdit?.products || [],
            items: menuToEdit?.items || []
        }

        console.log("Payload enviado:", payload)

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
        console.error("Error completo:", error.response?.data)
        toast.error(
            error?.response?.data?.message || 
            error.message || 
            'Error al guardar el menú', 
            { id: toastId }
        )
    }
}

    return (
        <Modal title={isEditing ? 'Editar Menú' : 'Nuevo Menú'} onClose={onClose}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <div>
                    <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Nombre del Menú *</label>
                    <input
                        {...register('name', { required: 'El nombre es requerido' })}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Menú Ejecutivo"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Descripción</label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Descripción del menú..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Restaurante *</label>
                        <select 
                            {...register('restaurant', { required: 'El restaurante es requerido' })} 
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white"
                        >
                            <option value="">Selecciona un restaurante</option>
                            {restaurants.map(r => (
                                <option key={r._id || r.id} value={r._id || r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                        {errors.restaurant && <p className="text-red-400 text-xs mt-1">{errors.restaurant.message}</p>}
                    </div>

                    <div>
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Tipo de Menú *</label>
                        <select 
                            {...register('menuType')} 
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white"
                        >
                            <option value="breakfast">Desayuno</option>
                            <option value="lunch">Almuerzo</option>
                            <option value="dinner">Cena</option>
                            <option value="all_day">Todo el día</option>
                            <option value="special">Especial</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Válido desde</label>
                        <input type="date" {...register('validFrom')} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white" />
                    </div>
                    <div>
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Válido hasta</label>
                        <input type="date" {...register('validTo')} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white" />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-bold disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Menú'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default MenuForm