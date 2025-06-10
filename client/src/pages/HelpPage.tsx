import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

const HelpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              ❓ Help Center
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Find answers to frequently asked questions and get help with using LaptopVerse
            </p>
          </div>

          {/* FAQ Section */}
          <div className="grid gap-8 mb-16">
            <div className="glass-dark p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">🔍 How to Search for Laptops</h2>
              <div className="space-y-4 text-white/80">
                <p>• Use the search bar to find laptops by brand, model, or specifications</p>
                <p>• Filter results by price range, processor type, RAM size, and storage</p>
                <p>• Sort by price, rating, or popularity to find the best options</p>
                <p>• Use advanced filters for more specific requirements</p>
              </div>
            </div>

            <div className="glass-dark p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">⚖️ How to Compare Laptops</h2>
              <div className="space-y-4 text-white/80">
                <p>• Click the "Add to Compare" button on any laptop card</p>
                <p>• You can compare up to 4 laptops at once</p>
                <p>• View detailed specifications side by side</p>
                <p>• See price comparisons across different retailers</p>
              </div>
            </div>

            <div className="glass-dark p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">💰 Understanding Prices</h2>
              <div className="space-y-4 text-white/80">
                <p>• Prices are updated regularly from multiple retailers</p>
                <p>• "Best Price" shows the lowest current price available</p>
                <p>• "All-time Low" displays the historical lowest price</p>
                <p>• Click "Buy Now" to be redirected to the retailer's website</p>
              </div>
            </div>

            <div className="glass-dark p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">⭐ Ratings and Reviews</h2>
              <div className="space-y-4 text-white/80">
                <p>• Ratings are aggregated from verified purchases on retailer sites</p>
                <p>• Review counts show the total number of customer reviews</p>
                <p>• Higher ratings indicate better customer satisfaction</p>
                <p>• Read detailed reviews on the retailer's website</p>
              </div>
            </div>

            <div className="glass-dark p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">🤖 Tech Assistant</h2>
              <div className="space-y-4 text-white/80">
                <p>• Get personalized laptop recommendations based on your needs</p>
                <p>• Ask questions about specifications and features</p>
                <p>• Compare different models with AI-powered insights</p>
                <p>• Receive expert advice on laptop selection</p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center glass-dark p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
            <p className="text-white/70 mb-6">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <Link 
              to="/contact" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              📧 Contact Support
            </Link>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link 
              to="/" 
              className="inline-flex items-center px-6 py-3 glass text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              🏠 Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HelpPage;
