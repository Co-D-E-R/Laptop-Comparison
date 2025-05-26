
import React from 'react';
import type { Product } from '../../types/Product';
import { handleProductClick, truncateText, formatPrice, getPrimaryImage } from '../../utils';
import './RecentlyViewed.css';

interface RecentlyViewedProps {
  products: Product[];
}

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ products }) => {
  if (products.length === 0) {
    return null;
  }
  return (
    <section id="recently-viewed" className="px-6 py-16 relative">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl mb-6 animate-pulse">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold gradient-text-secondary mb-4 animate-fadeInUp">
            ⏰ Your Cosmic Journey
          </h2>
          <p className="text-white/70 text-lg">Continue exploring where you left off in the laptop universe</p>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full mt-4"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product, idx) => (
            <div 
              key={`recently-viewed-${product.productId}-${idx}`}
              className="glass-card rounded-xl p-4 card-hover cursor-pointer group relative overflow-hidden"
              onClick={() => handleProductClick(product)}
            >
              {/* Cosmic trail effect */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-bl-xl">
                <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-3">                <div className="relative overflow-hidden rounded-lg bg-white/90 p-2">
                  <img
                    src={getPrimaryImage(product)}
                    alt={product.productName}
                    className="w-full h-28 object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {product.badge && (
                    <span className="absolute top-2 left-2 glass px-2 py-1 text-xs font-semibold rounded-full text-white">
                      {product.badge}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                  <div className="space-y-2">
                  <h3 className="text-cyan-300 font-medium text-sm leading-tight line-clamp-2 drop-shadow-lg">
                    {truncateText(product.productName, 50)}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1">
                    {product.technicalDetails?.RAM && (
                      <span className="glass px-2 py-1 text-xs text-cyan-300 rounded-md">
                        {product.technicalDetails.RAM}
                      </span>
                    )}
                    {product.technicalDetails?.["Screen Size"] && (
                      <span className="glass px-2 py-1 text-xs text-blue-300 rounded-md">
                        {product.technicalDetails["Screen Size"]}
                      </span>
                    )}
                  </div>                  <div className="text-gray-200 font-semibold text-sm drop-shadow-lg">
                    {formatPrice(product.price, product.basePrice)}
                  </div>

                  {product.rating && (
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400 text-xs">
                        {'★'.repeat(Math.floor(parseFloat(product.rating)))}
                      </span>
                      <span className="text-gray-200 text-xs drop-shadow-lg">{product.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Cosmic background elements */}
        <div className="absolute top-10 left-1/4 w-24 h-24 bg-cyan-500/5 rounded-full animate-float blur-xl"></div>
        <div className="absolute bottom-10 right-1/3 w-20 h-20 bg-blue-500/5 rounded-full animate-float blur-xl" style={{animationDelay: '2s'}}></div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
