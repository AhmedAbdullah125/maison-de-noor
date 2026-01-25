import React, { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { Product } from "../types";
import AppImage from "./AppImage";
import { toggleFavoriteRequest } from "./services/toggleFavorite";

interface ProductCardProps {
  product: Product;
  isFavourite: boolean; // initial / external
  onBook: (product: Product, quantity: number) => void; // kept
  onClick: (product: Product) => void;
  lang?: string; // ✅ optional (default ar)
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavourite,
  onBook,
  onClick,
  lang = "ar",
}) => {
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const wasSwipe = useRef(false);

  // ✅ local favourite state (overrides parent)
  const [localFav, setLocalFav] = useState<boolean>(isFavourite);
  const [favLoading, setFavLoading] = useState(false);

  // ✅ keep local state in sync if parent changes later
  useEffect(() => {
    setLocalFav(isFavourite);
  }, [isFavourite]);

  // Interaction Handlers (Touch & Mouse)
  const handleStart = (clientX: number) => {
    touchStartX.current = clientX;
    wasSwipe.current = false;
  };

  const handleEnd = (clientX: number) => {
    if (touchStartX.current !== null) {
      const diff = touchStartX.current - clientX;
      if (Math.abs(diff) > 30) {
        wasSwipe.current = true;
        if (diff < 0) setCurrentIndex((prev) => (prev + 1) % images.length);
        else setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
      touchStartX.current = null;
    }
  };

  const onCardClick = () => {
    if (!wasSwipe.current) onClick(product);
    wasSwipe.current = false;
  };

  // ✅ toggle favourite inside card (optimistic)
  const handleToggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favLoading) return;

    const prev = localFav;

    // 1) optimistic UI
    setLocalFav(!prev);
    setFavLoading(true);

    // 2) API call
    const res = await toggleFavoriteRequest(product.id, lang);

    // 3) rollback on failure
    if (!res.ok) {
      setLocalFav(prev);
    }

    setFavLoading(false);
  };

  return (
    <div
      onClick={onCardClick}
      className="flex flex-col rounded-[20px] bg-white shadow-sm border border-app-card/30 overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer h-full select-none"
    >
      {/* Image Carousel Area */}
      <div className="relative w-full aspect-square bg-app-bg/50 overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          // ✅ (اختياري) غالباً الصحيح بالسالب
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseUp={(e) => handleEnd(e.clientX)}
          onMouseLeave={() => {
            touchStartX.current = null;
          }}
        >
          {images.map((src, idx) => (
            <div key={idx} className="min-w-full h-full relative shrink-0">
              <AppImage
                src={src}
                alt={`${product.name} ${idx + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent z-10" />

        <div className="absolute inset-x-0 bottom-0 px-3 pb-7 pt-4 z-20 pointer-events-none">
          <h3 className="text-xs font-bold text-app-text text-right w-full line-clamp-2 font-alexandria leading-relaxed">
            {product.name}
          </h3>
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex ? "w-3 bg-app-gold" : "w-1 bg-app-textSec/30"
                  }`}
              />
            ))}
          </div>
        )}

        {/* ✅ Favourite button (dynamic + optimistic + loading lock) */}
        <button
          onClick={handleToggleFav}
          disabled={favLoading}
          className={`absolute top-2 right-2 p-1.5 backdrop-blur-md rounded-full shadow-sm transition-all z-30 ${localFav ? "bg-white text-red-500" : "bg-white/60 text-app-gold hover:bg-white"
            } ${favLoading ? "opacity-70" : "active:scale-90"}`}
          aria-label="toggle favourite"
        >
          <Heart size={16} fill={localFav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-3 pt-2 mt-auto flex items-center justify-between bg-white relative z-10">
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold text-app-gold font-alexandria leading-none">
            {product.price}
          </span>
          {product.oldPrice && (
            <span className="text-[9px] text-app-textSec line-through font-alexandria opacity-60 mt-0.5">
              {product.oldPrice}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!wasSwipe.current) onClick(product);
          }}
          className="bg-app-bg text-app-text font-bold text-[10px] py-1.5 px-3 rounded-xl border border-app-card hover:bg-app-card transition-colors shadow-sm flex items-center gap-1 active:scale-90"
        >
          <span>التفاصيل</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
