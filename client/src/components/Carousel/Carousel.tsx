import React from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/Product";
import { useCarousel } from "../../hooks/useCarousel";
import {
  handleProductClick,
  truncateText,
  formatPrice,
  getPrimaryImage,
  calculateDiscount,
} from "../../utils";
import { FavoriteButton } from "../FavoriteButton/FavoriteButton";
import { useCompare } from "../../hooks/useCompare";
import "./Carousel.css";

// Define the LaptopCompareItem type locally to match the context
interface LaptopCompareItem {
  _id: string;
  brand: string;
  series: string;
  specs?: {
    head?: string;
    details?: {
      imageLinks?: string[];
    };
  };
  allTimeLowPrice?: number;
}

interface CarouselProps {
  products: Product[];
}

const Carousel: React.FC<CarouselProps> = ({ products }) => {
  const { currentSlide, nextSlide, prevSlide, goToSlide } = useCarousel(
    products.length
  );
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();

  // Handle adding laptop to comparison
  const handleAddToCompare = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent product card click
    const laptopData: LaptopCompareItem = {
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
    // @ts-expect-error - Type mismatch between LaptopCompareItem and expected type
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
  return (
    <section id="carousel" className="relative px-6 py-16 overflow-hidden">
      {/* Background cosmic elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full animate-float blur-xl"></div>
        <div
          className="absolute bottom-10 right-1/4 w-24 h-24 bg-pink-500/10 rounded-full animate-float blur-xl"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="container mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold gradient-text mb-4 animate-fadeInUp">
            🌟 Featured Cosmic Collection
          </h2>
          <p className="text-white/70 text-lg">
            Explore the most stellar laptops in our galaxy
          </p>
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
                  onClick={() => handleProductClick(product, navigate)}
                >
                  <div className="glass-card rounded-3xl p-8 cursor-pointer group card-hover">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="relative">
                        {" "}
                        <div className="relative overflow-hidden rounded-2xl bg-white/5">
                          <img
                            src={getPrimaryImage(product)}
                            alt={product.productName}
                            className="w-full h-80 object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />

                          {/* Favorite Button */}
                          <div className="absolute top-4 left-4 z-10">
                            <FavoriteButton
                              laptopId={product.productId}
                              size="medium"
                              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
                            />
                          </div>

                          {/* Compare Button - Shows on Hover */}
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
                            <div className="absolute bottom-4 right-4 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-green-400/50">
                              In Compare
                            </div>
                          )}

                          {product.badge && (
                            <span className="absolute top-4 right-4 cosmic-button px-4 py-2 text-sm font-semibold rounded-full">
                              {product.badge}
                            </span>
                          )}
                          {calculateDiscount(
                            product.price,
                            product.basePrice
                          ) && (
                            <span className="absolute bottom-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-bold rounded-full shadow-lg animate-pulse">
                              {calculateDiscount(
                                product.price,
                                product.basePrice
                              )}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full animate-pulse neon-glow"></div>
                      </div>

                      <div className="space-y-6">
                        {" "}
                        <h3 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">
                          {truncateText(product.productName, 80)}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {product.technicalDetails?.["Processor Name"] && (
                            <span className="glass px-4 py-2 rounded-xl text-sm text-cyan-300 font-medium border border-cyan-400/30">
                              🔥{" "}
                              {truncateText(
                                product.technicalDetails["Processor Name"],
                                30
                              )}
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
                        {/* Multi-site pricing and ratings */}
                        {product.sites && product.sites.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {product.sites.map((site, index) => (
                                <div
                                  key={`${site.source}-${index}`}
                                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      {site.source === "amazon" ? (
                                        <span className="text-orange-400 font-bold text-sm">
                                          🛒 Amazon
                                        </span>
                                      ) : (
                                        <span className="text-blue-400 font-bold text-sm">
                                          🛍️ Flipkart
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div className="text-xl font-bold text-cyan-300 drop-shadow-lg mb-2">
                                    {site.price || "Price not available"}
                                  </div>

                                  {/* Rating */}
                                  {site.rating && (
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-yellow-400 text-sm drop-shadow-md">
                                          {"★".repeat(
                                            Math.floor(parseFloat(site.rating))
                                          )}
                                          {"☆".repeat(
                                            5 -
                                              Math.floor(
                                                parseFloat(site.rating)
                                              )
                                          )}
                                        </span>
                                        <span className="text-gray-200 font-medium text-sm">
                                          {site.rating}
                                        </span>
                                      </div>
                                      {site.ratingCount && (
                                        <span className="text-gray-400 text-xs">
                                          ({site.ratingCount})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Base price if available */}
                            {product.basePrice && (
                              <div className="text-center">
                                <span className="text-gray-400 text-sm">
                                  All-time low:{" "}
                                </span>
                                <span className="text-green-400 font-semibold">
                                  {product.basePrice}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Fallback for products without sites data */
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-cyan-300 drop-shadow-lg">
                              {formatPrice(product.price, product.basePrice)}
                            </div>
                            {product.basePrice &&
                              product.price &&
                              product.basePrice !== product.price && (
                                <div className="text-gray-400 text-xl line-through">
                                  {product.basePrice}
                                </div>
                              )}
                            {product.rating && (
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-400 text-lg drop-shadow-md">
                                    {"★".repeat(
                                      Math.floor(parseFloat(product.rating))
                                    )}
                                    {"☆".repeat(
                                      5 - Math.floor(parseFloat(product.rating))
                                    )}
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
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-dark rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-10"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center space-x-3 mt-8">
            {products.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 w-8"
                    : "bg-white/30 hover:bg-white/50"
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
