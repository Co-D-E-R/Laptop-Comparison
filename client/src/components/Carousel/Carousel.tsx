
import React from 'react';
import type { Product } from '../../types/Product';
import { useCarousel } from '../../hooks/useCarousel';
import { handleProductClick, truncateText, formatPrice, getPrimaryImage, calculateDiscount } from '../../utils';
import './Carousel.css';

interface CarouselProps {
  products: Product[];
}

const Carousel: React.FC<CarouselProps> = ({ products }) => {
  const { currentSlide, nextSlide, prevSlide, goToSlide } = useCarousel(products.length);

  if (products.length === 0) {
    return null;
  }
  return (
    <section id="carousel" className="relative px-6 py-16 overflow-hidden">
      {/* Background cosmic elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full animate-float blur-xl"></div>
        <div className="absolute bottom-10 right-1/4 w-24 h-24 bg-pink-500/10 rounded-full animate-float blur-xl" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold gradient-text mb-4 animate-fadeInUp">
            🌟 Featured Cosmic Collection
          </h2>
          <p className="text-white/70 text-lg">Explore the most stellar laptops in our galaxy</p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mt-4"></div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {products.map((product, idx) => (
                <div 
                  key={`carousel-${product.productId}-${idx}`}
                  className="w-full flex-shrink-0 px-4"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="glass-card rounded-3xl p-8 cursor-pointer group card-hover">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="relative">                        <div className="relative overflow-hidden rounded-2xl bg-white/5">
                          <img
                            src={getPrimaryImage(product)}
                            alt={product.productName}
                            className="w-full h-80 object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />                          {product.badge && (
                            <span className="absolute top-4 right-4 cosmic-button px-4 py-2 text-sm font-semibold rounded-full">
                              {product.badge}
                            </span>
                          )}
                          {calculateDiscount(product.price, product.basePrice) && (
                            <span className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-bold rounded-full shadow-lg animate-pulse">
                              {calculateDiscount(product.price, product.basePrice)}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full animate-pulse neon-glow"></div>
                      </div>
                      
                      <div className="space-y-6">                        <h3 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">
                          {truncateText(product.productName, 80)}
                        </h3>
                        
                        <div className="flex flex-wrap gap-3">
                          {product.technicalDetails?.["Processor Name"] && (
                            <span className="glass px-4 py-2 rounded-xl text-sm text-cyan-300 font-medium border border-cyan-400/30">
                              🔥 {truncateText(product.technicalDetails["Processor Name"], 30)}
                            </span>
                          )}
                          {product.technicalDetails?.RAM && (
                            <span className="glass px-4 py-2 rounded-xl text-sm text-green-300 font-medium border border-green-400/30">
                              💾 {product.technicalDetails.RAM}
                            </span>
                          )}
                          {product.technicalDetails?.["Screen Size"] && (
                            <span className="glass px-4 py-2 rounded-xl text-sm text-pink-300 font-medium border border-pink-400/30">
                              📺 {product.technicalDetails["Screen Size"]}
                            </span>
                          )}
                        </div>
                          <div className="space-y-2">
                          <div className="text-3xl font-bold text-cyan-300 drop-shadow-lg">
                            {formatPrice(product.price, product.basePrice)}
                          </div>
                          {product.basePrice && product.price && product.basePrice !== product.price && (
                            <div className="text-gray-400 text-xl line-through">
                              {product.basePrice}
                            </div>
                          )}
                        </div>
                        
                        {product.rating && (                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-400 text-lg drop-shadow-md">
                                {'★'.repeat(Math.floor(parseFloat(product.rating)))}
                                {'☆'.repeat(5 - Math.floor(parseFloat(product.rating)))}
                              </span>
                              <span className="text-gray-200 font-medium">
                                {product.rating}
                              </span>
                            </div>
                            <span className="text-gray-400 text-sm">
                              ({product.ratingsNumber} reviews)
                            </span>
                          </div>
                        )}

                        <button className="cosmic-button px-8 py-4 rounded-xl text-white font-semibold text-lg w-full sm:w-auto">
                          🚀 Explore This Laptop
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-dark rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-10"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-dark rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-10"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center space-x-3 mt-8">
            {products.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Carousel;
