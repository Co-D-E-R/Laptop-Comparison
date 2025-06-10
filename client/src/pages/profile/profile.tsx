import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Header, Footer } from "../../components";
import { useHistory } from "../../hooks/useHistory";
import { useFavorites } from "../../hooks/useFavorites";
import { useCompare } from "../../hooks/useCompare";
import { useNavigate } from "react-router-dom";
import { handleProductClick, truncateText, getPrimaryImage, filterProductsWithValidPrices } from "../../utils";
import type { Product } from "../../types/Product";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    historyProducts,
    loading: historyLoading,
    error: historyError,
    deleteHistoryItem,
    clearHistory,
  } = useHistory(user?.id);

  const {
    favoriteProducts,
    loading: favoritesLoading,
    error: favoritesError,
    removeFavorite,
  } = useFavorites(user?.id);

  // Filter products with valid prices
  const validHistoryProducts = filterProductsWithValidPrices(historyProducts);
  const validFavoriteProducts = filterProductsWithValidPrices(favoriteProducts);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteHistoryItem = async (laptopId: string) => {
    const success = await deleteHistoryItem(laptopId);
    if (success) {
      showNotification("success", "Item removed from history");
    } else {
      showNotification("error", "Failed to remove item from history");
    }
    setShowDeleteConfirm(null);
  };

  const handleClearHistory = async () => {
    const success = await clearHistory();
    if (success) {
      showNotification("success", "History cleared successfully");
    } else {
      showNotification("error", "Failed to clear history");
    }
    setShowClearConfirm(false);
  };

  const handleRemoveFavorite = async (laptopId: string) => {
    const success = await removeFavorite(laptopId);
    if (success) {
      showNotification("success", "Removed from favorites");
    } else {
      showNotification("error", "Failed to remove from favorites");
    }
  };

  // Compare handlers
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
    const success = addToCompare(laptopData);
    if (success) {
      showNotification("success", "Added to compare");
    } else {
      showNotification("error", "Cannot add to compare - either full or already added");
    }
  };

  const handleRemoveFromCompare = (productId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeFromCompare(productId);
    showNotification("success", "Removed from compare");
  };

  const ProductCard = ({
    product,
    onDelete,
    onRemove,
    type,
  }: {
    product: Product;
    onDelete?: (id: string) => void;
    onRemove?: (id: string) => void;
    type: "history" | "favorite";
  }) => (
    <div className="glass rounded-xl p-4 card-hover group relative overflow-hidden">
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        {type === "history" && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(product.productId);
            }}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 p-1 rounded-lg transition-all duration-200"
            title="Remove from history"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        {type === "favorite" && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(product.productId);
            }}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 p-1 rounded-lg transition-all duration-200"
            title="Remove from favorites"
          >
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>

      <div
        className="cursor-pointer"
        onClick={() => handleProductClick(product, navigate)}
      >
        <div className="relative overflow-hidden rounded-lg bg-white/90 p-2 mb-3 group">
          <img
            src={getPrimaryImage(product)}
            alt={product.productName}
            className="w-full h-24 object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Compare Button */}
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {isInCompare(product.productId) ? (
              <button
                onClick={(e) => handleRemoveFromCompare(product.productId, e)}
                className="flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm hover:bg-green-600/90 rounded-md text-white text-xs font-medium transition-all duration-200 shadow-lg"
              >
                <span>✓</span>
                <span>In Compare</span>
              </button>
            ) : (
              <button
                onClick={(e) => handleAddToCompare(product, e)}
                disabled={!canAddMore}
                className="flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm hover:bg-blue-600/90 disabled:bg-gray-500/50 disabled:cursor-not-allowed rounded-md text-white text-xs font-medium transition-all duration-200 shadow-lg"
              >
                <span>⚖️</span>
                <span>Add to Compare</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-cyan-300 font-medium text-sm leading-tight line-clamp-2">
            {truncateText(product.productName, 40)}
          </h3>

          <div className="text-gray-200 font-semibold text-sm">
            {product.price}
          </div>

          {product.rating && (
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400 text-xs">
                {"★".repeat(Math.floor(parseFloat(product.rating)))}
              </span>
              <span className="text-gray-200 text-xs">{product.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] via-[#2d1b4d] to-[#1a2a4f] text-white">
      <Header />

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === "success"
              ? "bg-green-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Remove from History?</h3>
            <p className="text-white/70 mb-6">This action cannot be undone.</p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleDeleteHistoryItem(showDeleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 glass hover:bg-white/10 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Clear All History?</h3>
            <p className="text-white/70 mb-6">
              This will remove all items from your browsing history. This action
              cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleClearHistory}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 glass hover:bg-white/10 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 gradient-text">
              User Profile
            </h1>

            <div className="glass-card p-8 rounded-2xl border border-purple-500/30 mb-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {user?.name}
                  </h2>
                  <p className="text-white/60">{user?.email}</p>
                </div>
              </div>

              {/* Recently Viewed Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-cyan-300">
                    Recently Viewed ({historyProducts.length})
                  </h3>
                  <div className="flex items-center space-x-3">
                    {historyProducts.length > 5 && (
                      <button
                        onClick={() => navigate("/recently-viewed")}
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <span>View All</span>
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    )}
                    {historyProducts.length > 0 && (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-all duration-200"
                      >
                        Clear All History
                      </button>
                    )}
                  </div>
                </div>

                {historyLoading ? (
                  <div className="glass rounded-xl p-6">
                    <div className="animate-pulse text-white/60">
                      Loading history...
                    </div>
                  </div>
                ) : historyError ? (
                  <div className="glass rounded-xl p-6">
                    <div className="text-red-400">
                      Error loading history: {historyError}
                    </div>
                  </div>
                ) : validHistoryProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {validHistoryProducts.slice(0, 5).map((product) => (
                        <ProductCard
                          key={product.productId}
                          product={product}
                          onDelete={() =>
                            setShowDeleteConfirm(product.productId)
                          }
                          type="history"
                        />
                      ))}
                    </div>
                    {validHistoryProducts.length > 5 && (
                      <div className="mt-4 text-center">
                        <p className="text-white/60 text-sm">
                          Showing 5 of {validHistoryProducts.length} laptops
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="glass rounded-xl p-6">
                    <p className="text-white/60">No laptops viewed yet</p>
                  </div>
                )}
              </div>

              {/* Favorites Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-cyan-300">
                    Favorites ({favoriteProducts.length})
                  </h3>
                  <div className="flex items-center space-x-3">
                    {favoriteProducts.length > 4 && (
                      <button
                        onClick={() => navigate("/favorites")}
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <span>View All</span>
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {favoritesLoading ? (
                  <div className="glass rounded-xl p-6">
                    <div className="animate-pulse text-white/60">
                      Loading favorites...
                    </div>
                  </div>
                ) : favoritesError ? (
                  <div className="glass rounded-xl p-6">
                    <div className="text-red-400">
                      Error loading favorites: {favoritesError}
                    </div>
                  </div>
                ) : validFavoriteProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {validFavoriteProducts.slice(0, 4).map((product) => (
                        <ProductCard
                          key={product.productId}
                          product={product}
                          onRemove={handleRemoveFavorite}
                          type="favorite"
                        />
                      ))}
                    </div>
                    {validFavoriteProducts.length > 4 && (
                      <div className="mt-4 text-center">
                        <p className="text-white/60 text-sm">
                          Showing 4 of {validFavoriteProducts.length} favorites
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="glass rounded-xl p-6">
                    <p className="text-white/60">No favorites saved yet</p>
                  </div>
                )}
              </div>

              {/* Additional Sections */}
              <div className="grid grid-cols-1 gap-6">
                <div className="glass rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-cyan-300">
                    Price Alerts
                  </h3>
                  <p className="text-white/60">
                    Coming soon - Set price alerts for your favorite laptops
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
