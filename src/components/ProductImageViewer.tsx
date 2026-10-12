import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface ProductImageViewerProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  productName: string;
  onClose: () => void;
}

export function ProductImageViewer({
  isOpen,
  images,
  initialIndex = 0,
  productName,
  onClose,
}: ProductImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchDistStartRef = useRef<number | null>(null);
  const pinchScaleStartRef = useRef<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync index when viewer opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)));
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex, images.length]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(Number((prev + 0.4).toFixed(2)), 2.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.4).toFixed(2)), 1);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetZoom();
  }, [images.length, resetZoom]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetZoom();
  }, [images.length, resetZoom]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut, resetZoom]);

  // Mouse pan handling for desktop when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Helper to calculate touch distance between 2 fingers
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to Zoom start
      const dist = getTouchDistance(e.touches);
      pinchDistStartRef.current = dist;
      pinchScaleStartRef.current = scale;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();

      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now };

      if (scale > 1) {
        // Pan mode
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistStartRef.current !== null) {
      // Active Pinch
      const dist = getTouchDistance(e.touches);
      const ratio = dist / pinchDistStartRef.current;
      const newScale = Math.min(Math.max(pinchScaleStartRef.current * ratio, 1), 2.5);
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (scale > 1 && isDragging) {
        // Active Pan
        setPosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchDistStartRef.current = null;
    }

    if (e.touches.length === 0) {
      setIsDragging(false);

      if (scale === 1 && touchStartRef.current) {
        const touch = e.changedTouches[0];
        const diffX = touch.clientX - touchStartRef.current.x;
        const diffY = touch.clientY - touchStartRef.current.y;
        const diffTime = Date.now() - touchStartRef.current.time;

        // Instant switch on swipe without sliding animation
        if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) && diffTime < 600) {
          if (diffX > 0) {
            handlePrev();
          } else {
            handleNext();
          }
        }
      }

      touchStartRef.current = null;
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex] || images[0];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full screen image viewer"
      className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Bar: Title, Zoom Controls, Close Button */}
      <div className="flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex flex-col max-w-[55%] sm:max-w-md">
          <h2 className="text-xs sm:text-base font-bold text-white truncate">{productName}</h2>
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center">
          {/* Close Lightbox */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            title="Close (Esc)"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Backdrop click closes when not dragging or zoomed
          if (scale === 1 && e.target === containerRef.current) {
            onClose();
          }
        }}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-6 z-20 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 backdrop-blur-sm shadow-xl"
          >
            <ChevronLeft size={22} className="sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Display Image with Scale and Pan */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {(() => {
            const optMainImg = getOptimizedImageUrl(currentImg, { width: 1400, quality: 90 });
            if (!optMainImg) return null;
            return (
              <img
                key={currentImg}
                src={optMainImg}
                alt={`${productName} - View ${currentIndex + 1}`}
                decoding="async"
                referrerPolicy="no-referrer"
                className="max-h-[68vh] sm:max-h-[80vh] max-w-[92vw] sm:max-w-[85vw] w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                draggable={false}
              />
            );
          })()}
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-6 z-20 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 backdrop-blur-sm shadow-xl"
          >
            <ChevronRight size={22} className="sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip & Navigation Helper */}
      <div className="px-3 pt-2 pb-5 sm:py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col items-center gap-2 z-20">
        {images.length > 1 ? (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto max-w-full py-1 px-2 custom-scrollbar">
            {images.map((img, idx) => {
              const optThumb = getOptimizedImageUrl(img, { width: 140, quality: 75 });
              if (!optThumb) return null;
              const isSelected = currentIndex === idx;
              return (
                <button
                  key={`${idx}-${img}`}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    resetZoom();
                  }}
                  aria-label={`View image ${idx + 1}`}
                  className={`w-11 h-11 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400/50 scale-105 opacity-100'
                      : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                  }`}
                >
                  <img
                    src={optThumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={64}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="hidden lg:block text-xs text-slate-400">
            Pinch to zoom • Drag to pan when zoomed
          </div>
        )}

        <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-400">
          <span>Pinch to Zoom</span>
          <span>•</span>
          <span>Swipe or Arrows to Navigate</span>
          <span>•</span>
          <span>Esc or ✕ to Close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
