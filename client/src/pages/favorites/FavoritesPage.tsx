import React from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../../components";
import { useFavorites } from "../../hooks/useFavorites";
import { useAuth } from "../../contexts/AuthContext";
import { handleProductClick, truncateText, getPrimaryImage } from "../../utils";
import type { Product } from "../../types/Product";

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favoriteProducts, loading, error, removeFavorite } = useFavorites(
    user?.id
  );

  const handleRemoveFavorite = async (productId: string): Promise<boolean> => {
    try {
      return await removeFavorite(productId);
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      return false;
    }
  };

  const FavoriteCard = ({ product }: { product: Product }) => (
    <div
      className="glass-card rounded-xl p-4 card-hover cursor-pointer group relative overflow-hidden"
      onClick={() => handleProductClick(product, navigate)}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveFavorite(product.productId);
        }}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
        title="Remove from favorites"
      >
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
      </button>

      {/* Cosmic trail effect */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-pink-500/30 to-red-500/30 rounded-bl-xl">
        <div className="absolute top-1 right-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
      </div>

      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-lg bg-white/90 p-2">
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
          <h3 className="text-pink-300 font-medium text-sm leading-tight line-clamp-2 drop-shadow-lg">
            {truncateText(product.productName, 50)}
          </h3>

          <div className="flex flex-wrap gap-1">
            {product.technicalDetails?.RAM && (
              <span className="glass px-2 py-1 text-xs text-pink-300 rounded-md">
                {product.technicalDetails.RAM}
              </span>
            )}
            {product.technicalDetails?.["Screen Size"] && (
              <span className="glass px-2 py-1 text-xs text-red-300 rounded-md">
                {product.technicalDetails["Screen Size"]}
              </span>
            )}
          </div>

          {/* Site-specific pricing and ratings */}
          {product.sites && product.sites.length > 0 ? (
            <div className="space-y-1">
              {product.sites.map(
                (site: NonNullable<Product["sites"]>[0], siteIdx: number) => (
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
                        <span className="text-gray-200">{site.rating}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-gray-200 font-semibold text-sm drop-shadow-lg">
                {product.price}
              </div>
              {product.rating && (
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400 text-xs">
                    {"★".repeat(Math.floor(parseFloat(product.rating)))}
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
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-red-500/0 to-purple-500/0 group-hover:from-pink-500/5 group-hover:via-red-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
    </div>
  );

  return (
    <div className="min-h-screen cosmic-bg">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 hover:text-purple-300 px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </button>

          <h1 className="text-4xl font-bold mb-4 gradient-text">
            Favorite Laptops
          </h1>
          <p className="text-white/70 text-lg">
            Your saved favorites - {favoriteProducts.length} laptops
          </p>
        </div>

        {loading ? (
          <div className="glass-card p-12 rounded-2xl border border-purple-500/30 text-center">
            <div className="animate-pulse text-white/60">
              Loading favorites...
            </div>
          </div>
        ) : error ? (
          <div className="glass-card p-12 rounded-2xl border border-red-500/30 text-center">
            <div className="text-red-400">Error loading favorites: {error}</div>
          </div>
        ) : favoriteProducts.length > 0 ? (
          <div className="glass-card p-6 rounded-2xl border border-purple-500/30">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {favoriteProducts.map((product, idx) => (
                <FavoriteCard
                  key={`favorite-${product.productId}-${idx}`}
                  product={product}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 rounded-2xl border border-purple-500/30 text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-purple-400/50"
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
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              No Favorite Laptops
            </h3>
            <p className="text-white/60 mb-8">
              Start adding laptops to your favorites to see them here
            </p>
            <button
              onClick={() => navigate("/search")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Browse Laptops
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FavoritesPage;
