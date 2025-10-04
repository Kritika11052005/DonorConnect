"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BannerSlideShow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAnimating = useRef(false);

  // Your banner images from public folder
  const banners = [
    '/banner2.png',
    '/banner1.png',
    '/banner3.png',
    '/banner4.png',
    '/banner5.png'
  ];

  // GSAP animation for slide transitions
  const animateSlide = (fromIndex:number, toIndex:number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const currentSlideEl = slideRefs.current[fromIndex];
    const nextSlideEl = slideRefs.current[toIndex];

    // Create timeline for smooth transition
    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating.current = false;
      }
    });

    tl.set(nextSlideEl, { zIndex: 2, opacity: 0 })
      .to(nextSlideEl, {
        opacity: 1,
        duration: 1.2,
        ease: 'power2.inOut'
      })
      .set(currentSlideEl, { zIndex: 1 });
  };

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % banners.length;
        animateSlide(prev, next);
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  // Initial setup
  useEffect(() => {
    slideRefs.current.forEach((slide, index) => {
      if (slide) {
        gsap.set(slide, {
          opacity: index === 0 ? 1 : 0,
          zIndex: index === 0 ? 2 : 1
        });
      }
    });
  }, []);

  const goToSlide = (index:number) => {
    if (index !== currentSlide && !isAnimating.current) {
      animateSlide(currentSlide, index);
      setCurrentSlide(index);
    }
  };

  const goToPrevious = () => {
    const prevIndex = (currentSlide - 1 + banners.length) % banners.length;
    goToSlide(prevIndex);
  };

  const goToNext = () => {
    const nextIndex = (currentSlide + 1) % banners.length;
    goToSlide(nextIndex);
  };

  return (
    <section className="relative h-[90vh] w-full overflow-hidden ">
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={index}
            ref={(el) => { slideRefs.current[index] = el; }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={banner}
              alt={`Banner ${index + 1}`}
              className="w-full h-full object-fill"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/50 backdrop-blur-sm p-3 rounded-full transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/50 backdrop-blur-sm p-3 rounded-full transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}