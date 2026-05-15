import { useEffect } from 'react'
import { Star, MessageSquare, User } from 'lucide-react'
import useReviewStore from '../store/reviewStore'

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

const ProductReviews = ({ platoId }) => {
  const { reviewsByProduct, fetchReviewsByProduct } = useReviewStore()
  const data = reviewsByProduct[platoId]

  useEffect(() => {
    if (platoId && !data) {
      fetchReviewsByProduct(platoId)
    }
  }, [platoId, data, fetchReviewsByProduct])

  if (!data) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 rounded-full border-2 border-t-orange-500 border-zinc-700 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
              key={review._id || i}
              className="p-4 bg-zinc-800/20 rounded-2xl border border-white/5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold leading-none">
                      {review.usuarioId?.slice(0, 8) || 'Usuario'}...
                    </p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <StarDisplay value={review.rating} size={11} />
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