import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Star, Loader2, MessageSquare, ChefHat } from 'lucide-react'
import useReviewStore from '../store/reviewStore'
import useAuthStore from '../../auth/store/authStore'
import Modal from '../../../shared/components/ui/Modal'

// ── Estrellas interactivas ────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readOnly = false }) => {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`transition-transform ${readOnly ? 'cursor-default' : 'hover:scale-110 active:scale-95'}`}
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          <Star
            size={readOnly ? 14 : 28}
            className={`transition-colors ${
              star <= active
                ? 'fill-orange-400 text-orange-400'
                : 'fill-zinc-700 text-zinc-700'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

const RATING_LABELS = {
  1: 'Muy malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: '¡Excelente!',
}

// ── Modal principal de reseña ─────────────────────────────────────────────────
const ReviewModal = ({ product, restauranteId, onClose, onSuccess, reviewToEdit }) => {
  const user = useAuthStore((state) => state.user)
  const { submitting, submitReview, updateReview } = useReviewStore()
  const isEditing = !!reviewToEdit

  const [rating, setRating] = useState(reviewToEdit?.rating || 0)
  const [ratingError, setRatingError] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { comentario: reviewToEdit?.comentario || '' } })

  const comentario = watch('comentario', '')

  const onSubmit = async ({ comentario }) => {
    if (!rating) {
      setRatingError(true)
      return
    }
    setRatingError(false)

    const toastId = toast.loading(isEditing ? 'Actualizando reseña...' : 'Publicando reseña...')
    try {
      if (isEditing) {
        await updateReview(reviewToEdit._id || reviewToEdit.id, { rating, comentario })
        toast.success('¡Reseña actualizada!', { id: toastId })
      } else {
        await submitReview({
          usuarioId: user?._id || user?.id || user?.uid,
          restauranteId,
          platoId: product._id || product.id || product.productId,
          rating,
          comentario,
        })
        toast.success('¡Reseña publicada!', { id: toastId })
      }
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      toast.error(error?.message || 'Error al procesar la reseña', { id: toastId })
    }
  }

  return (
    <Modal title={isEditing ? "Editar reseña" : "Escribir reseña"} onClose={onClose}>
      <div className="space-y-6">

        {/* Producto reseñado */}
        <div className="flex items-center gap-4 p-4 bg-zinc-800/40 rounded-2xl border border-white/5">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <ChefHat size={24} className="text-zinc-500" />
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm">{product.name}</p>
            {product.category && (
              <p className="text-zinc-500 text-xs mt-0.5">
                {typeof product.category === 'object' ? product.category.name : product.category}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Calificación con estrellas */}
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-3 block">
              Calificación *
            </label>
            <StarRating value={rating} onChange={(v) => { setRating(v); setRatingError(false) }} />
            {rating > 0 && (
              <p className="text-orange-400 text-xs font-semibold mt-2">
                {RATING_LABELS[rating]}
              </p>
            )}
            {ratingError && (
              <p className="text-red-400 text-xs mt-1 font-medium">
                Selecciona una calificación
              </p>
            )}
          </div>

          {/* Comentario */}
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
              Comentario * <span className="normal-case font-normal">(mín. 10 caracteres)</span>
            </label>
            <textarea
              {...register('comentario', {
                required: 'El comentario es requerido',
                minLength: { value: 10, message: 'Mínimo 10 caracteres' },
                maxLength: { value: 500, message: 'Máximo 500 caracteres' },
              })}
              rows={4}
              placeholder="¿Cómo estuvo el plato? ¿Qué te gustó o no te gustó?"
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600 resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.comentario ? (
                <p className="text-red-400 text-[10px] font-medium">{errors.comentario.message}</p>
              ) : (
                <span />
              )}
              <span className={`text-[10px] ${comentario.length > 450 ? 'text-orange-400' : 'text-zinc-600'}`}>
                {comentario.length}/500
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-4 rounded-2xl text-sm font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Publicando...</>
                : <><MessageSquare size={16} /> Publicar reseña</>
              }
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default ReviewModal