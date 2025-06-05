import {
  Header,
  Carousel,
  ProductGrid,
  RecentlyViewed,
  DealsSection,
  Footer,
} from "../../components";
import { useProducts } from "../../hooks/useProducts";
import { useHistory } from "../../hooks/useHistory";
import { useAuth } from "../../contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const {
    carouselProducts,
    recommendedProducts,
    popularProducts,
    dealProducts,
    loading,
    error,
    refetch,
  } = useProducts({ userId: user?.id });

  // Use history hook for authenticated users
  const { historyProducts } = useHistory(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center relative">
        <div className="text-center">
          <div className="cosmic-loader mx-auto"></div>
          <p className="text-white/80 mt-6 text-lg font-medium">
            Loading your cosmic laptop experience...
          </p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center relative">
        <div className="glass-card p-8 rounded-2xl border border-red-500/30 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Connection Lost</h3>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="cosmic-button px-6 py-3 rounded-xl text-white font-semibold"
          >
            Reconnect to the Cosmos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] via-[#2d1b4d] to-[#1a2a4f] text-white relative overflow-hidden">
      <Header />
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="container mx-auto text-center">
          <div className="animate-fadeInUp">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-float drop-shadow-2xl">
              Welcome to the
            </h1>
            <h2 className="text-4xl md:text-6xl font-bold gradient-text mb-8 neon-text">
              Laptop Universe
            </h2>
            <p className="text-xl text-cyan-100 max-w-2xl mx-auto mb-12 leading-relaxed drop-shadow-lg">
              Discover, compare, and find your perfect laptop companion in our
              cosmic marketplace. Experience the future of laptop comparison
              with AI-powered recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="cosmic-button px-8 py-4 rounded-xl text-white font-semibold text-lg w-full sm:w-auto min-w-[220px]">
                🚀 Explore Laptops
              </button>
            </div>
          </div>
        </div>
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full animate-float neon-glow"></div>
        <div
          className="absolute top-40 right-16 w-16 h-16 bg-pink-500/20 rounded-full animate-float neon-glow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-cyan-500/20 rounded-full animate-float neon-glow"
          style={{ animationDelay: "2s" }}
        ></div>
      </section>{" "}
      <main className="flex-1 space-y-16 pb-16">
        <Carousel products={carouselProducts} />
        {user ? (
          // Authenticated user content
          <>
            <ProductGrid
              products={recommendedProducts}
              title="🎯 Cosmic Recommendations"
              sectionId="recommended"
            />
            {historyProducts.length > 0 && (
              <RecentlyViewed products={historyProducts} />
            )}
            <DealsSection products={dealProducts} />
          </>
        ) : (
          // Non-authenticated user content
          <>
            <ProductGrid
              products={popularProducts}
              title="🌟 Popular Laptops"
              sectionId="popular"
            />
            <DealsSection products={dealProducts} />
            <ProductGrid
              products={carouselProducts}
              title="🚀 Explore Laptops"
              sectionId="explore"
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
