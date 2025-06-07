import React from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/Product";
import {
  handleProductClick,
  truncateText,
  getPrimaryImage,
  calculateDiscount,
} from "../../utils";
import { FavoriteButton } from "../FavoriteButton";
import { useCompare } from "../../hooks/useCompare";
import "./ProductGrid.css";

interface ProductGridProps {
  products: Product[];
  title: string;
  sectionId: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  title,
  sectionId,
}) => {
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();

  // Handle adding laptop to comparison
  const handleAddToCompare = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent product card click
    
    // Create simplified laptop data structure that matches LaptopCompareItem interface
    const laptopCompareItem = {
      _id: product.productId,
      brand: product.technicalDetails?.["Processor Brand"] || "Unknown",
      series: product.technicalDetails?.["Model Name"] || "Unknown",
      specs: {
        head: product.productName,
        details: {
          imageLinks: product.technicalDetails?.imageLinks || []
        }
      },
      allTimeLowPrice: parseFloat(product.basePrice?.replace(/[^\d.]/g, '') || '0')
    };
    
    const success = addToCompare(laptopCompareItem);
    if (!success) {
      console.log("Cannot add laptop to compare - either full or already added");
    }
  };

  // Handle removing laptop from comparison
  const handleRemoveFromCompare = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // Prevent product card click
    removeFromCompare(productId);
  };

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
              onClick={() => handleProductClick(product, navigate)}
            >
              {" "}
              <div className="relative mb-4 overflow-hidden rounded-xl bg-white/5">
                <img
                  src={getPrimaryImage(product)}
                  alt={product.productName}
                  className="w-full h-48 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Favorite Button */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                  <FavoriteButton laptopId={product.productId} size="small" />
                </div>

                {/* Compare Button - Shows on Hover (Search Page Style) */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                  {isInCompare(product.productId) ? (
                    <button
                      onClick={(e) => handleRemoveFromCompare(e, product.productId)}
                      className="bg-red-500/90 hover:bg-red-600/90 text-white px-4 py-2 rounded-lg font-semibold backdrop-blur-sm border border-red-400/50 transition-all duration-300 flex items-center gap-2 shadow-lg z-50"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <span>✓</span>
                      Remove from Compare
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleAddToCompare(e, product)}
                      disabled={!canAddMore}
                      className={`${
                        canAddMore
                          ? "bg-purple-500/90 hover:bg-purple-600/90 text-white"
                          : "bg-gray-500/90 text-gray-300 cursor-not-allowed"
                      } px-4 py-2 rounded-lg font-semibold backdrop-blur-sm border border-purple-400/50 transition-all duration-300 flex items-center gap-2 shadow-lg z-50`}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <span>⚖️</span>
                      {canAddMore ? "Add to Compare" : "Compare Full"}
                    </button>
                  )}
                </div>

                {/* Compare Status Indicator */}
                {isInCompare(product.productId) && (
                  <div className="absolute bottom-3 right-3 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-green-400/50">
                    In Compare
                  </div>
                )}

                {product.badge && (
                  <span className="absolute top-3 right-3 cosmic-button px-3 py-1 text-xs font-semibold rounded-full">
                    {product.badge}
                  </span>
                )}
                {calculateDiscount(product.price, product.basePrice) && (
                  <span className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg">
                    {calculateDiscount(product.price, product.basePrice)}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2 drop-shadow-lg">
                  {truncateText(product.productName, 60)}
                </h3>

                <div className="space-y-2">
                  {product.technicalDetails?.["Processor Name"] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-300 font-medium">
                        Processor:
                      </span>
                      <span className="text-gray-200 text-right text-xs">
                        {truncateText(
                          product.technicalDetails["Processor Name"],
                          25
                        )}
                      </span>
                    </div>
                  )}
                  {product.technicalDetails?.RAM && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-300 font-medium">RAM:</span>
                      <span className="text-gray-200">
                        {product.technicalDetails.RAM}
                      </span>
                    </div>
                  )}
                  {product.technicalDetails?.["Screen Size"] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-300 font-medium">Screen:</span>
                      <span className="text-gray-200">
                        {product.technicalDetails["Screen Size"]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {/* Prices from both sites */}
                  <div className="flex gap-4 items-center justify-center">
                    {product.sites?.map((site) =>
                      site.price ? (
                        <div
                          key={site.source}
                          className="flex flex-col items-center"
                        >
                          <span className="font-bold text-cyan-300 text-base">
                            {site.source === "amazon" ? "Amazon" : "Flipkart"}
                          </span>
                          <span className="text-white text-lg font-bold">
                            {site.price}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                  {/* Ratings from both sites */}
                  <div className="flex gap-4 items-center justify-center mt-1">
                    {product.sites?.map((site) =>
                      site.rating ? (
                        <div
                          key={site.source + "-rating"}
                          className="flex flex-col items-center"
                        >
                          <span className="text-xs text-cyan-300 font-medium">
                            {site.source === "amazon" ? "Amazon" : "Flipkart"}{" "}
                            Rating
                          </span>
                          <span className="text-yellow-400 font-bold">
                            {site.rating} ★
                          </span>
                          {site.ratingCount && (
                            <span className="text-gray-400 text-xs">
                              ({site.ratingCount})
                            </span>
                          )}
                        </div>
                      ) : null
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
