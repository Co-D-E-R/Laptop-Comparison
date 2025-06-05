import React from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/Product";
import {
  handleProductClick,
  truncateText,
  formatPrice,
  getPrimaryImage,
  calculateDiscount,
} from "../../utils";
import { FavoriteButton } from "../FavoriteButton/FavoriteButton";
import { useCompare } from "../../hooks/useCompare";
import "./DealsSection.css";

interface DealsSectionProps {
  products: Product[];
}

const DealsSection: React.FC<DealsSectionProps> = ({ products }) => {
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();

  // Handle adding laptop to comparison
  const handleAddToCompare = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent product card click
    const laptopData = {
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
    // @ts-expect-error - Temporary suppress until interface is fixed
    const success = addToCompare(laptopData);
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

  // Debug log to check product structure
  if (products.length > 0) {
    console.log("DealsSection - First product structure:", products[0]);
    console.log(
      "DealsSection - Technical details:",
      products[0]?.technicalDetails
    );
    console.log(
      "DealsSection - Image links:",
      products[0]?.technicalDetails?.imageLinks
    );
  }
  return (
    <section id="deals" className="px-6 py-16 relative overflow-hidden">
      {/* Cosmic background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full animate-float blur-2xl"></div>
        <div
          className="absolute bottom-20 left-10 w-32 h-32 bg-red-500/10 rounded-full animate-float blur-2xl"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      <div className="container mx-auto relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-6 animate-pulse">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold mb-4 animate-fadeInUp">
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              🔥 Cosmic Fire Deals
            </span>
          </h2>
          <p className="text-white/70 text-lg mb-6">
            Limited time stellar offers on premium laptops
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, idx) => (
            <div
              key={`deals-${product.productId}-${idx}`}
              className="glass-card rounded-2xl overflow-hidden card-hover cursor-pointer group relative"
              onClick={() => handleProductClick(product, navigate)}
            >
              {" "}
              {/* Deal flame animation */}
              <div className="absolute top-4 left-4 z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-sm font-bold">🔥</span>
                  </div>
                  <span className="cosmic-button px-3 py-1 text-xs font-bold rounded-full">
                    HOT DEAL
                  </span>
                  {calculateDiscount(product.price, product.basePrice) && (
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg animate-pulse">
                      {calculateDiscount(product.price, product.basePrice)}
                    </span>
                  )}
                </div>
              </div>
              {/* Favorite Button */}
              <div className="absolute top-4 right-4 z-10">
                <FavoriteButton
                  laptopId={product.productId}
                  size="small"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
                />
              </div>{" "}
              <div className="relative bg-white/90 p-3 rounded-lg">
                <img
                  src={getPrimaryImage(product)}
                  alt={product.productName}
                  className="w-full h-44 object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    console.log(
                      "Image load error for product:",
                      product.productName
                    );
                    console.log(
                      "Attempted image URL:",
                      getPrimaryImage(product)
                    );
                    console.log("Technical details:", product.technicalDetails);
                    // Fallback to a placeholder
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://via.placeholder.com/400x300/1a1a2e/ffffff?text=No+Image";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {/* Compare Button - Shows on Hover */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                  {isInCompare(product.productId) ? (
                    <button
                      onClick={(e) => handleRemoveFromCompare(e, product.productId)}
                      className="bg-red-500/90 hover:bg-red-600/90 text-white px-4 py-2 rounded-lg font-semibold backdrop-blur-sm border border-red-400/50 transition-all duration-300 flex items-center gap-2 shadow-lg"
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
                      } px-4 py-2 rounded-lg font-semibold backdrop-blur-sm border border-purple-400/50 transition-all duration-300 flex items-center gap-2 shadow-lg`}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <span>⚖️</span>
                      {canAddMore ? "Add to Compare" : "Compare Full"}
                    </button>
                  )}
                </div>

                {/* Compare Status Indicator */}
                {isInCompare(product.productId) && (
                  <div className="absolute bottom-4 right-4 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-green-400/50">
                    In Compare
                  </div>
                )}

                {product.badge && (
                  <span className="absolute top-4 right-4 glass px-3 py-1 text-xs font-semibold rounded-full text-white">
                    {product.badge}
                  </span>
                )}
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-cyan-300 font-semibold text-lg leading-tight line-clamp-2 drop-shadow-lg">
                  {truncateText(product.productName, 55)}
                </h3>
                <div className="space-y-2">
                  {product.technicalDetails?.["Processor Name"] && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        💻
                      </span>{" "}
                      <span className="text-gray-200 flex-1 drop-shadow-lg">
                        {truncateText(
                          product.technicalDetails["Processor Name"],
                          20
                        )}
                      </span>
                    </div>
                  )}
                  {product.technicalDetails?.RAM && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        🧠
                      </span>
                      <span className="text-gray-200 drop-shadow-lg">
                        {product.technicalDetails.RAM}
                      </span>
                    </div>
                  )}
                  {product.technicalDetails?.["Screen Size"] && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-pink-500/20 rounded-lg flex items-center justify-center">
                        📺
                      </span>
                      <span className="text-gray-200 drop-shadow-lg">
                        {product.technicalDetails["Screen Size"]}
                      </span>
                    </div>
                  )}
                </div>{" "}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-cyan-300 drop-shadow-lg">
                      {formatPrice(product.price, product.basePrice)}
                    </div>
                    {product.basePrice &&
                      product.price &&
                      product.basePrice !== product.price && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-lg line-through">
                            {product.basePrice}
                          </span>
                          <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-2 py-1 rounded-full text-green-400 text-sm font-medium">
                            💰 Great Savings!
                          </span>
                        </div>
                      )}
                  </div>
                </div>
                {product.rating && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="text-yellow-400">
                        {"★".repeat(Math.floor(parseFloat(product.rating)))}
                        {"☆".repeat(5 - Math.floor(parseFloat(product.rating)))}
                      </div>{" "}
                      <span className="text-gray-200 drop-shadow-lg">
                        {product.rating}
                      </span>
                    </div>
                    {product.ratingsNumber && (
                      <span className="text-gray-300">
                        ({product.ratingsNumber})
                      </span>
                    )}
                  </div>
                )}
                <button className="w-full cosmic-button py-3 rounded-xl text-white font-semibold group-hover:scale-105 transition-transform duration-300">
                  🚀 Grab This Deal
                </button>
              </div>
              {/* Cosmic glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/0 via-red-500/0 to-pink-500/0 group-hover:from-orange-500/10 group-hover:via-red-500/10 group-hover:to-pink-500/10 transition-all duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
