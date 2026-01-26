import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppImage from './AppImage';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, alt, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [prevTranslate, setPrevTranslate] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If no images or empty array, handle gracefully
  if (!images || images.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Touch/Mouse Handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  const handleMove = (clientX: number) => {
    if (isDragging) {
      const currentPosition = clientX;
      const diff = currentPosition - startX;
      setCurrentTranslate(prevTranslate + diff);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    const movedBy = currentTranslate - prevTranslate;

    // Threshold to change slide
    if (movedBy < -50) nextSlide();
    else if (movedBy > 50) prevSlide();

    // Reset translate logic is handled by the effect listening to currentIndex
    // But we need to sync prevTranslate to index * width for smooth transition
    // Actually, simple index-based CSS transform is cleaner for React than manual pixel pushing
    // So we reset translate state to rely on index
    setCurrentTranslate(0);
    setPrevTranslate(0);
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  return (
    <div
      className={`relative overflow-hidden bg-app-bg/50 select-none group ${className}`}
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateX(${currentIndex * 100}%)` }} // Positive because RTL layout (images stack right to left)
      >
        {images.map((src, index) => (
          <div key={`${src}-${index}`} className="min-w-full h-full flex items-center justify-center relative">
            <AppImage
              src={src}
              alt={`${alt} ${index + 1}`}
              className="w-full h-full object-cover pointer-events-none"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${currentIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
            />
          ))}
        </div>
      )}

      {/* Desktop Arrows (Visible on Hover) */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full items-center justify-center text-app-text shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-white"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-4 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full items-center justify-center text-app-text shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-white"
          >
            <ChevronLeft size={20} />
          </button>
        </>
      )}

      {/* Image Counter Badge */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-lg z-20">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;