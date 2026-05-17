import { useEffect, useState } from 'react'
import { Star, MessageSquare, User, Pencil, Trash2 } from 'lucide-react'
import useReviewStore from '../store/reviewStore'
import useAuthStore from '../../auth/store/authStore'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const StarDisplay = ({ value, size = 14 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={
          star <= Math.round(value)
            ? 'fill-orange-400 text-orange-400'
            : 'fill-zinc-700 text-zinc-700'
        }
      />
    ))}
  </div>
)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const ProductReviews = ({ platoId, onEdit }) => {
  const user = useAuthStore((state) => state.user)
  const { reviewsByProduct, fetchReviewsByProduct, deleteReview } = useReviewStore()
  const data = reviewsByProduct[platoId]
  const [reviewToDelete, setReviewToDelete] = useState(null)

  const handleDelete = async () => {
    if (!reviewToDelete) return
    
    const toastId = toast.loading('Eliminando reseña...')
    try {
      await deleteReview(reviewToDelete, platoId)
      setReviewToDelete(null)
      toast.success('Reseña eliminada', { id: toastId })
    } catch (error) {
      toast.error(error.message, { id: toastId })
    }
  }

  useEffect(() => {
    // Si no hay datos, o si hay datos pero el array de reviews está vacío (pre-llenado solo con promedios)
    if (platoId && (!data || !data.reviews || data.reviews.length === 0)) {
      fetchReviewsByProduct(platoId)
    }
  }, [platoId, data?.reviews?.length, fetchReviewsByProduct])

  if (!data) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 rounded-full border-2 border-t-orange-500 border-zinc-700 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviewToDelete && (
        <ConfirmDialog
          message="¿Estás seguro de que deseas eliminar tu reseña? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setReviewToDelete(null)}
        />
      )}
      {/* Resumen */}
      <div className="flex items-center gap-4 p-4 bg-zinc-800/30 rounded-2xl border border-white/5">
        <div className="text-center">
          <p className="text-3xl font-black text-white">{data.promedioRating || '—'}</p>
          <StarDisplay value={data.promedioRating} size={12} />
        </div>
        <div className="border-l border-white/10 pl-4">
          <p className="text-zinc-400 text-xs">
            <span className="text-white font-bold">{data.totalReviews}</span>{' '}
            {data.totalReviews === 1 ? 'reseña' : 'reseñas'}
          </p>
        </div>
      </div>

      {/* Lista de reseñas */}
      {data.reviews.length === 0 ? (
        <div className="text-center py-6 text-zinc-600">
          <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-xs font-medium">Sin reseñas todavía</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {data.reviews.map((review, i) => (
            <div
              key={review._id || `review-${i}`}
              className="p-4 bg-zinc-800/20 rounded-2xl border border-white/5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold leading-none">
                      {typeof review.usuarioId === 'string' ? review.usuarioId?.slice(0, 8) : 'Usuario'}...
                    </p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {review.usuarioId === (user?._id || user?.id) && (
                    <div className="flex items-center gap-1.5 mr-2">
                      <button 
                        onClick={() => onEdit(review)}
                        className="p-1.5 text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                        title="Editar reseña"
                      >
                        <Pencil size={12} />
                      </button>
                      <button 
                        onClick={() => setReviewToDelete(review._id || review.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Eliminar reseña"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  <StarDisplay value={review.rating} size={11} />
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">{review.comentario}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductReviews