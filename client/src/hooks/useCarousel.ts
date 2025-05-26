
import { useState, useEffect, useCallback } from 'react';

interface UseCarouselReturn {
  currentSlide: number;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
}

export const useCarousel = (totalSlides: number, autoPlay: boolean = true, interval: number = 5000): UseCarouselReturn => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  useEffect(() => {
    if (!autoPlay || totalSlides <= 1) return;

    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [nextSlide, autoPlay, interval, totalSlides]);

  return {
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide
  };
};
