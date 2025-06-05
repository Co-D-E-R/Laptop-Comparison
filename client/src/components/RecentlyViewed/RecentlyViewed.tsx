import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/Product";
import {
  handleProductClick,
  truncateText,
  formatPrice,
  getPrimaryImage,
} from "../../utils";
import { FavoriteButton } from "../FavoriteButton/FavoriteButton";
import { useCompare } from "../../hooks/useCompare";
import "./RecentlyViewed.css";

interface RecentlyViewedProps {
  products: Product[];
  onDeleteItem?: (productId: string) => Promise<boolean>;
  onClearAll?: () => Promise<boolean>;
  showDeleteButtons?: boolean;
}

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  products,
  onDeleteItem,
  onClearAll,
  showDeleteButtons = false,
}) => {
  const navigate = useNavigate();
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [clearingAll, setClearingAll] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCompare, removeFromCompare, canAddMore, isInCompare } = useCompare();  // Compare handlers
  const handleAddToCompare = (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
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
      allTimeLowPrice: typeof product.basePrice === 'string' ? parseFloat(product.basePrice?.replace(/[^\d.]/g, '') || '0') : (product.basePrice || 0)
    };
    // @ts-expect-error - Temporary suppress until interface is fixed
    const success = addToCompare(laptopData);
    if (!success) {
      console.log("Cannot add laptop to compare - either full or already added");
    }
  };
  const handleRemoveFromCompare = (productId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeFromCompare(productId);
  };

  if (products.length === 0) {
    return null;
  }

  // Slider configuration
  const itemsPerSlide = 5;
  const totalSlides = Math.ceil(products.length / itemsPerSlide);
  const shouldShowSlider = products.length > itemsPerSlide;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
  };

  if (products.length === 0) {
    return null;
  }

  const handleDeleteItem = async (
    productId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (!onDeleteItem || deletingItems.has(productId)) return;

    setDeletingItems((prev) => new Set(prev).add(productId));
    try {
      const success = await onDeleteItem(productId);
      if (!success) {
        // Handle error - maybe show a toast notification
        console.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleClearAll = async () => {
    if (!onClearAll || clearingAll) return;

    const confirmClear = window.confirm(
      "Are you sure you want to clear your entire history? This action cannot be undone."
    );
    if (!confirmClear) return;

    setClearingAll(true);
    try {
      const success = await onClearAll();
      if (!success) {
        console.error("Failed to clear history");
      }
    } catch (error) {
      console.error("Error clearing history:", error);
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <section id="recently-viewed" className="px-6 py-16 relative">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl mb-6 animate-pulse">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-4xl font-bold gradient-text-secondary animate-fadeInUp">
              ⏰ Your Cosmic Journey
            </h2>
            {showDeleteButtons && onClearAll && products.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearingAll}
                className="glass-card px-4 py-2 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all duration-300 text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clear entire history"
              >
                {clearingAll ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                    Clearing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Clear All
                  </div>
                )}
              </button>
            )}
          </div>
          <p className="text-white/70 text-lg">
            Continue exploring where you left off in the laptop universe
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full mt-4"></div>{" "}
        </div>

        {/* Products Container */}
        <div className="relative">
          {shouldShowSlider ? (
            /* Slider Layout for more than 5 items */
            <div className="overflow-hidden rounded-xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }, (_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-2">
                      {products
                        .slice(
                          slideIndex * itemsPerSlide,
                          (slideIndex + 1) * itemsPerSlide
                        )
                        .map((product, idx) => (
                          <div
                            key={`recently-viewed-${product.productId}-${slideIndex}-${idx}`}
                            className="glass-card rounded-xl p-4 card-hover cursor-pointer group relative overflow-hidden"
                            onClick={() =>
                              handleProductClick(product, navigate)
                            }
                          >
                            {/* Cosmic trail effect */}
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-bl-xl">
                              <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            </div>

                            {/* Favorite Button */}
                            <div className="absolute top-2 right-10 z-10">
                              <FavoriteButton
                                laptopId={product.productId}
                                size="small"
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
                              />
                            </div>

                            {/* Delete button */}
                            {showDeleteButtons && onDeleteItem && (
                              <button
                                onClick={(e) =>
                                  handleDeleteItem(product.productId, e)
                                }
                                disabled={deletingItems.has(product.productId)}
                                className="absolute top-2 left-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove from history"
                              >
                                {deletingItems.has(product.productId) ? (
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                )}
                              </button>
                            )}

                            <div className="space-y-3">
                              <div className="relative overflow-hidden rounded-lg bg-white/90 p-2 group">
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
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>                                {/* Compare Button */}
                                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                                  {isInCompare(product.productId) ? (
                                    <button
                                      onClick={(e) => handleRemoveFromCompare(product.productId, e)}
                                      className="flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm hover:bg-green-600/90 rounded-md text-white text-xs font-medium transition-all duration-200 shadow-lg"
                                      style={{ pointerEvents: 'auto' }}
                                    >
                                      <span>✓</span>
                                      <span>In Compare</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => handleAddToCompare(product, e)}
                                      disabled={!canAddMore}
                                      className="flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm hover:bg-blue-600/90 disabled:bg-gray-500/50 disabled:cursor-not-allowed rounded-md text-white text-xs font-medium transition-all duration-200 shadow-lg"
                                      style={{ pointerEvents: 'auto' }}
                                    >
                                      <span>⚖️</span>
                                      <span>Add to Compare</span>
                                    </button>
                                  )}
                                </div>
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
                                  {product.technicalDetails?.[
                                    "Screen Size"
                                  ] && (
                                    <span className="glass px-2 py-1 text-xs text-blue-300 rounded-md">
                                      {product.technicalDetails["Screen Size"]}
                                    </span>
                                  )}
                                </div>

                                {/* Site-specific pricing and ratings */}
                                {product.sites && product.sites.length > 0 ? (
                                  <div className="space-y-1">
                                    {product.sites.map((site, siteIdx) => (
                                      <div
                                        key={`${product.productId}-${site.source}-${siteIdx}`}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center space-x-1">
                                          <span
                                            className={
                                              site.source === "amazon"
                                                ? "text-orange-400"
                                                : "text-blue-400"
                                            }
                                          >
                                            {site.source === "amazon"
                                              ? "🛒"
                                              : "🛍️"}
                                          </span>
                                          <span className="text-gray-200 font-medium capitalize">
                                            {site.source}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-gray-200 font-semibold">
                                            {site.price}
                                          </span>
                                          <div className="flex items-center space-x-1">
                                            <span className="text-yellow-400">
                                              {"★".repeat(
                                                Math.floor(
                                                  parseFloat(site.rating || "0")
                                                )
                                              )}
                                            </span>
                                            <span className="text-gray-200">
                                              {site.rating}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="text-gray-200 font-semibold text-sm drop-shadow-lg">
                                      {formatPrice(
                                        product.price,
                                        product.basePrice
                                      )}
                                    </div>
                                    {product.rating && (
                                      <div className="flex items-center space-x-1">
                                        <span className="text-yellow-400 text-xs">
                                          {"★".repeat(
                                            Math.floor(
                                              parseFloat(product.rating)
                                            )
                                          )}
                                        </span>
                                        <span className="text-gray-200 text-xs drop-shadow-lg">
                                          {product.rating}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Hover glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Regular Grid Layout for 5 or fewer items */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product, idx) => (
                <div
                  key={`recently-viewed-${product.productId}-${idx}`}
                  className="glass-card rounded-xl p-4 card-hover cursor-pointer group relative overflow-hidden"
                  onClick={() => handleProductClick(product, navigate)}
                >
                  {/* Cosmic trail effect */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-bl-xl">
                    <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  </div>

                  {/* Favorite Button */}
                  <div className="absolute top-2 right-10 z-10">
                    <FavoriteButton
                      laptopId={product.productId}
                      size="small"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
                    />
                  </div>

                  {/* Delete button */}
                  {showDeleteButtons && onDeleteItem && (
                    <button
                      onClick={(e) => handleDeleteItem(product.productId, e)}
                      disabled={deletingItems.has(product.productId)}
                      className="absolute top-2 left-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from history"
                    >
                      {deletingItems.has(product.productId) ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </button>
                  )}

                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-lg bg-white/90 p-2 group">
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
                      )}                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Compare Button */}
                      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                        {isInCompare(product.productId) ? (
                          <button
                            onClick={(e) => handleRemoveFromCompare(product.productId, e)}
                            className="flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm hover:bg-green-600/90 rounded-md text-white text-xs font-medium transition-all duration-200 shadow-lg"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <span>✓</span>
                            <span>In Compare</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCompare(product, e)}
                            disabled={!canAddMore}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm hover:bg-blue-600/90 disabled:bg-gray-500/50 disabled:cursor-not-allowed rounded-md text-white text-xs font-medium transition-all duration-200 shadow-lg"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <span>⚖️</span>
                            <span>Add to Compare</span>
                          </button>
                        )}
                      </div>
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
                      </div>

                      {/* Site-specific pricing and ratings */}
                      {product.sites && product.sites.length > 0 ? (
                        <div className="space-y-1">
                          {product.sites.map((site, siteIdx) => (
                            <div
                              key={`${product.productId}-${site.source}-${siteIdx}`}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center space-x-1">
                                <span
                                  className={
                                    site.source === "amazon"
                                      ? "text-orange-400"
                                      : "text-blue-400"
                                  }
                                >
                                  {site.source === "amazon" ? "🛒" : "🛍️"}
                                </span>
                                <span className="text-gray-200 font-medium capitalize">
                                  {site.source}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-200 font-semibold">
                                  {site.price}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-400">
                                    {"★".repeat(
                                      Math.floor(parseFloat(site.rating || "0"))
                                    )}
                                  </span>
                                  <span className="text-gray-200">
                                    {site.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-gray-200 font-semibold text-sm drop-shadow-lg">
                            {formatPrice(product.price, product.basePrice)}
                          </div>
                          {product.rating && (
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-400 text-xs">
                                {"★".repeat(
                                  Math.floor(parseFloat(product.rating))
                                )}
                              </span>
                              <span className="text-gray-200 text-xs drop-shadow-lg">
                                {product.rating}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation buttons for slider */}
          {shouldShowSlider && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-dark rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={prevSlide}
                disabled={currentSlide === 0}
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
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-dark rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
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
                {Array.from({ length: totalSlides }, (_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 w-8"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cosmic background elements */}
        <div className="absolute top-10 left-1/4 w-24 h-24 bg-cyan-500/5 rounded-full animate-float blur-xl"></div>
        <div
          className="absolute bottom-10 right-1/3 w-20 h-20 bg-blue-500/5 rounded-full animate-float blur-xl"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
