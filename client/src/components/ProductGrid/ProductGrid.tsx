
import React from 'react';
import type { Product } from '../../types/Product';
import { handleProductClick, truncateText, formatPrice, getPrimaryImage, calculateDiscount } from '../../utils';
import './ProductGrid.css';

interface ProductGridProps {
  products: Product[];
  title: string;
  sectionId: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, title, sectionId }) => {
  if (products.length === 0) {
    return null;
  }
  return (
    <section id={sectionId} className="px-6 py-16">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold gradient-text mb-4 animate-fadeInUp">
            {title}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product, idx) => (
            <div 
              key={`${sectionId}-${product.productId}-${idx}`}
              className="glass-card rounded-2xl p-6 card-hover cursor-pointer group"
              onClick={() => handleProductClick(product)}
            >              <div className="relative mb-4 overflow-hidden rounded-xl bg-white/5">
                <img
                  src={getPrimaryImage(product)}
                  alt={product.productName}
                  className="w-full h-48 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />                {product.badge && (
                  <span className="absolute top-3 right-3 cosmic-button px-3 py-1 text-xs font-semibold rounded-full">
                    {product.badge}
                  </span>
                )}
                {calculateDiscount(product.price, product.basePrice) && (
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg">
                    {calculateDiscount(product.price, product.basePrice)}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
                <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2 drop-shadow-lg">
                  {truncateText(product.productName, 60)}
                </h3>
                
                <div className="space-y-2">
                  {product.technicalDetails?.["Processor Name"] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-300 font-medium">Processor:</span>
                      <span className="text-gray-200 text-right text-xs">
                        {truncateText(product.technicalDetails["Processor Name"], 25)}
                      </span>
                    </div>
                  )}
                  {product.technicalDetails?.RAM && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-300 font-medium">RAM:</span>
                      <span className="text-gray-200">{product.technicalDetails.RAM}</span>
                    </div>
                  )}
                  {product.technicalDetails?.["Screen Size"] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-300 font-medium">Screen:</span>
                      <span className="text-gray-200">{product.technicalDetails["Screen Size"]}</span>
                    </div>
                  )}
                </div>

                {product.rating && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-yellow-400 drop-shadow-md">
                        {'★'.repeat(Math.floor(parseFloat(product.rating)))}
                        {'☆'.repeat(5 - Math.floor(parseFloat(product.rating)))}
                      </div>
                      <span className="text-gray-300 text-sm font-medium">
                        {product.rating}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      ({product.ratingsNumber})
                    </span>
                  </div>
                )}                <div className="pt-2 border-t border-white/20">
                  <div className="space-y-1">
                    <div className="text-cyan-300 font-bold text-lg drop-shadow-lg">
                      {formatPrice(product.price, product.basePrice)}
                    </div>
                    {product.basePrice && product.price && product.basePrice !== product.price && (
                      <div className="text-gray-400 text-sm line-through">
                        {product.basePrice}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
