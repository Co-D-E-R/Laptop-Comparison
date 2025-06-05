import React from "react";
import { useNavigate } from "react-router-dom";
import { Header, RecentlyViewed, Footer } from "../../components";
import { useHistory } from "../../hooks/useHistory";
import { useAuth } from "../../contexts/AuthContext";

const RecentlyViewedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { historyProducts, deleteHistoryItem, clearHistory } = useHistory(
    user?.id
  );

  const handleDeleteItem = async (productId: string): Promise<boolean> => {
    try {
      return await deleteHistoryItem(productId);
    } catch (error) {
      console.error("Failed to delete item:", error);
      return false;
    }
  };
  const handleClearAll = async (): Promise<boolean> => {
    try {
      return await clearHistory();
    } catch (error) {
      console.error("Failed to clear history:", error);
      return false;
    }
  };

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
            Recently Viewed Laptops
          </h1>
          <p className="text-white/70 text-lg">
            Your browsing history - {historyProducts.length} laptops viewed
          </p>
        </div>

        {historyProducts.length > 0 ? (
          <div className="glass-card p-6 rounded-2xl border border-purple-500/30">
            <RecentlyViewed
              products={historyProducts}
              onDeleteItem={handleDeleteItem}
              onClearAll={handleClearAll}
              showDeleteButtons={true}
            />
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              No Recently Viewed Items
            </h3>
            <p className="text-white/60 mb-8">
              Start browsing laptops to see your viewing history here
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

export default RecentlyViewedPage;
