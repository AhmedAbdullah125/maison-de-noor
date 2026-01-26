import React, { useMemo, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppImage from "./AppImage";
import AppHeader from "./AppHeader";
import { useGetReviews } from "./services/useGetReviews";

interface Review {
  id: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  clientName?: string;
}

interface ReviewCardProps {
  review: Review;
  onPlay: (review: Review) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onPlay }) => {
  // fallback thumbnail لو مفيش thumbnail من API
  const fallbackThumb =
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=400&q=80";

  return (
    <div
      onClick={() => onPlay(review)}
      className="relative aspect-[9/16] w-full rounded-lg overflow-hidden bg-app-card shadow-sm border border-app-card/30 cursor-pointer group active:scale-[0.98] transition-all"
    >
      <AppImage
        src={review.thumbnailUrl || fallbackThumb}
        alt=""
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
          <Play size={24} fill="currentColor" className="ml-1" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white text-[10px] font-bold text-right opacity-90">
          {review.clientName || "مراجعة عميلة"}
        </p>
      </div>
    </div>
  );
};

const ReviewsTab: React.FC<{ lang?: string }> = ({ lang = "ar" }) => {
  const navigate = useNavigate();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // لو عايز Pagination بعدين
  const [page] = useState(1);
  const reviewsQuery = useGetReviews(lang, page);

  const reviews: Review[] = useMemo(() => {
    return reviewsQuery.data?.reviews ?? [];
  }, [reviewsQuery.data]);

  const handlePlayReview = (review: Review) => {
    setActiveReview(review);
    setIsVideoOpen(true);
  };

  const handleCloseVideo = () => {
    if (videoRef.current) videoRef.current.pause();
    setIsVideoOpen(false);
    setActiveReview(null);
  };

  return (
    <div className="animate-fadeIn flex flex-col h-full bg-app-bg relative">
      <AppHeader title="تجارب عميلاتنا" onBack={() => navigate("/account")} />

      <div className="flex-1 overflow-y-auto no-scrollbar pb-28 pt-24">
        {/* Loading */}
        {reviewsQuery.isLoading && (
          <div className="px-6">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] w-full rounded-lg bg-gray-200 animate-shimmer border border-app-card/30"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {reviewsQuery.isError && !reviewsQuery.isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm font-bold text-app-text mb-4">حدث خطأ أثناء تحميل المراجعات</p>
            <button
              onClick={() => reviewsQuery.refetch()}
              className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Empty */}
        {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm font-bold text-app-text">لا يوجد مراجعات حالياً</p>
          </div>
        )}

        {/* List */}
        {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length > 0 && (
          <div className="grid grid-cols-2 gap-4 px-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onPlay={handlePlayReview} />
            ))}
          </div>
        )}
      </div>

      {isVideoOpen && activeReview?.videoUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-scaleIn"
          onClick={handleCloseVideo}
        >
          <button
            onClick={handleCloseVideo}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-50 backdrop-blur-md"
          >
            <X size={24} />
          </button>

          <div
            className="w-full max-w-sm md:max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <video ref={videoRef} src={activeReview.videoUrl} className="w-full h-auto max-h-[80vh] object-contain bg-black" autoPlay playsInline muted loop controls />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;
