import { create } from 'zustand'
import {
    getReservations,
    createReservation as createReservationRequest,
    updateReservation as updateReservationRequest,
    cancelReservation as cancelReservationRequest,
} from '../../../shared/api/reservations'

const getReservationId = (reservation) => reservation?._id || reservation?.id

const getErrorMessage = (error) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Ocurrió un error al procesar la solicitud'
    )
}

const useReservationStore = create((set) => ({
    reservations: [],
    loading: false,
    error: null,

    fetchReservations: async (params = {}) => {
        set({ loading: true, error: null })
        try {
            const response = await getReservations(params)
            set({
                reservations: response.data?.reservations || [],
                loading: false,
            })
        } catch (error) {
            set({
                error: getErrorMessage(error),
                loading: false,
            })
        }
    },

    createReservation: async (data) => {
        set({ loading: true, error: null })
        try {
            const response = await createReservationRequest(data)
            const newReservation = response.data?.reservation

            set((state) => ({
                reservations: newReservation
                    ? [...state.reservations, newReservation]
                    : state.reservations,
                loading: false,
            }))

            return newReservation
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message, loading: false })
            throw new Error(message)
        }
    },

    updateReservation: async (id, data) => {
        set({ loading: true, error: null })
        try {
            const response = await updateReservationRequest(id, data)
            const updatedReservation = response.data?.reservation

            set((state) => ({
                reservations: state.reservations.map((r) =>
                    getReservationId(r) === id ? updatedReservation : r
                ),
                loading: false,
            }))

            return updatedReservation
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message, loading: false })
            throw new Error(message)
        }
    },

    cancelReservation: async (id) => {
        set({ loading: true, error: null })
        try {
            const response = await cancelReservationRequest(id)
            const updatedReservation = response.data?.reservation

            set((state) => ({
                reservations: state.reservations.map((r) =>
                    getReservationId(r) === id
                        ? updatedReservation ?? { ...r, status: 'cancelada' }
                        : r
                ),
                loading: false,
            }))
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message, loading: false })
            throw new Error(message)
        }
    },

    clearReservationError: () => {
        set({ error: null })
    },

    // Handlers para WebSockets
    handleSocketUpdate: (updatedRes) => {
        set((state) => ({
            reservations: state.reservations.map((r) =>
                getReservationId(r) === getReservationId(updatedRes) ? updatedRes : r
            ),
        }))
    },

    handleSocketNewReservation: (newRes) => {
        set((state) => ({
            reservations: [newRes, ...state.reservations]
        }))
    },
}))

export default useReservationStore