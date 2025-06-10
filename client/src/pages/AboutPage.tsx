import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse top-20 left-20"></div>
        <div className="absolute w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse bottom-20 right-20 animation-delay-2000"></div>
        <div className="absolute w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6">
            About LaptopVerse
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Your cosmic gateway to laptop comparisons and reviews. We navigate the universe of laptops 
            to help you find your perfect digital companion.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="glass p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            </div>
            <p className="text-white/70 leading-relaxed text-lg">
              We believe that finding the perfect laptop shouldn't be a daunting task. Our mission is to 
              simplify the laptop buying process by providing comprehensive comparisons, detailed reviews, 
              and personalized recommendations that help you make informed decisions.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">🌟</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Our Vision</h2>
            </div>
            <p className="text-white/70 leading-relaxed text-lg">
              To become the most trusted and comprehensive platform for laptop enthusiasts, professionals, 
              and casual users alike. We envision a world where everyone can easily find their ideal laptop 
              that perfectly matches their needs and budget.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center gradient-text mb-12">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-xl">
              <div className="text-3xl mb-4">💻</div>
              <h3 className="text-xl font-semibold text-white mb-3">Comprehensive Database</h3>
              <p className="text-white/70">
                Access thousands of laptop models from all major brands with detailed specifications and real-time pricing.
              </p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="text-3xl mb-4">⚖️</div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Comparisons</h3>
              <p className="text-white/70">
                Compare laptops side-by-side with our intelligent comparison tool that highlights key differences.
              </p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Recommendations</h3>
              <p className="text-white/70">
                Get personalized laptop recommendations powered by AI that understands your specific needs and preferences.
              </p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-white mb-3">Best Deals</h3>
              <p className="text-white/70">
                Discover the latest deals and discounts from multiple retailers to get the best value for your money.
              </p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-3">Real Reviews</h3>
              <p className="text-white/70">
                Read authentic user reviews and expert opinions to make informed decisions about your next laptop.
              </p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-3">Advanced Search</h3>
              <p className="text-white/70">
                Find exactly what you're looking for with our powerful search and filtering system.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center gradient-text mb-12">Our Team</h2>
          <div className="glass p-8 rounded-2xl text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Passionate Tech Enthusiasts</h3>
            <p className="text-white/70 leading-relaxed max-w-2xl mx-auto">
              Our team consists of dedicated tech enthusiasts, data scientists, and user experience experts 
              who are passionate about technology and committed to helping you find the perfect laptop. 
              We combine years of industry experience with cutting-edge technology to deliver the best 
              possible service to our users.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="glass p-8 rounded-2xl">
            <h2 className="text-3xl font-bold gradient-text mb-4">Ready to Find Your Perfect Laptop?</h2>
            <p className="text-white/70 mb-6 text-lg">
              Join thousands of satisfied users who have found their ideal laptops through LaptopVerse.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="glass px-8 py-3 rounded-xl text-white font-semibold hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105"
            >
              Start Exploring 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
