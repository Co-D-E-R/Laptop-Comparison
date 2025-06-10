
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-8">
      {/* Enhanced cosmic divider with animated gradient */}
      <div className="absolute top-0 left-0 right-0 h-0.5 footer-gradient-divider"></div>
      
      <div className="glass-dark backdrop-blur-xl">
        {/* Cosmic background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-purple-500/5 rounded-full animate-float blur-xl"></div>
          <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-cyan-500/5 rounded-full animate-float blur-xl" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-32 right-1/4 w-20 h-20 bg-pink-500/5 rounded-full animate-float blur-xl" style={{ animationDelay: '4s' }}></div>
        </div>
        
        {/* Full width container - no max-width restrictions */}
        <div className="w-full px-12 py-4 relative footer-compact-spacing">
          {/* Main footer content - Full width grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-4">
            
            {/* Brand Section - Compact */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center footer-brand-logo">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold gradient-text font-orbitron">LaptopVerse</h3>
                  <p className="text-purple-300/80 text-xs font-medium">Cosmic Tech Discovery</p>
                </div>
              </div>
              
              <p className="text-white/70 leading-relaxed text-sm max-w-xs">
                Your gateway to laptop comparisons and reviews. Find your perfect digital companion.
              </p>
              
              {/* Compact social media */}
              <div className="space-y-2">
                <h4 className="text-white font-semibold text-sm">Follow Us</h4>
                <div className="flex space-x-2">
                  <a href="#" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white footer-social-link hover:bg-purple-500/20 transition-all duration-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white footer-social-link hover:bg-blue-500/20 transition-all duration-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white footer-social-link hover:bg-pink-500/20 transition-all duration-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378 0 0-.599 2.282-.744 2.84-.282 1.084-1.064 2.456-1.549 3.235C9.584 23.815 10.77 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white footer-social-link hover:bg-red-500/20 transition-all duration-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Quick Links - Compact */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white font-orbitron footer-section-header">Quick Links</h4>
              <ul className="space-y-1">
                <li>
                  <a href="#carousel" className="text-white/70 hover:text-cyan-400 footer-nav-link transition-all duration-300 text-sm">
                    Featured Laptops
                  </a>
                </li>
                <li>
                  <a href="#recommended" className="text-white/70 hover:text-green-400 footer-nav-link transition-all duration-300 text-sm">
                    Recommended
                  </a>
                </li>
                <li>
                  <a href="#recently-viewed" className="text-white/70 hover:text-orange-400 footer-nav-link transition-all duration-300 text-sm">
                    Recently Viewed
                  </a>
                </li>
                <li>
                  <a href="#deals" className="text-white/70 hover:text-red-400 footer-nav-link transition-all duration-300 text-sm">
                    Hot Deals
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Support - Compact */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white font-orbitron footer-section-header">Support</h4>
              <ul className="space-y-1">
                <li>
                  <Link to="/help" className="text-white/70 hover:text-purple-400 footer-nav-link transition-all duration-300 text-sm">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-blue-400 footer-nav-link transition-all duration-300 text-sm">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-white/70 hover:text-green-400 footer-nav-link transition-all duration-300 text-sm">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Legal - New fourth column */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white font-orbitron footer-section-header">Legal</h4>
              <ul className="space-y-1">
                <li>
                  <Link to="/privacy" className="text-white/70 hover:text-yellow-400 footer-nav-link transition-all duration-300 text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-white/70 hover:text-cyan-400 footer-nav-link transition-all duration-300 text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-white/70 hover:text-pink-400 footer-nav-link transition-all duration-300 text-sm">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Compact divider */}
          <div className="footer-enhanced-divider mb-4">
            <div className="relative flex justify-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 rounded-full">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-xs font-medium">Made with</span>
                  <span className="text-red-400 animate-pulse">💜</span>
                  <span className="text-white text-xs font-medium">cosmic energy</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Full width bottom section */}
          <div className="footer-bottom rounded-t-lg -mx-12 px-12 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 gap-4">
              <div className="text-white/70 text-xs font-medium">
                <span>&copy; 2025 LaptopVerse. All rights reserved.</span>
              </div>
              
              <div className="flex items-center flex-wrap justify-center gap-3 text-xs">
                <Link to="/terms" className="text-white/60 hover:text-purple-400 footer-nav-link transition-all duration-300 font-medium">
                  Terms
                </Link>
                <Link to="/privacy" className="text-white/60 hover:text-cyan-400 footer-nav-link transition-all duration-300 font-medium">
                  Privacy
                </Link>
                <Link to="/cookies" className="text-white/60 hover:text-pink-400 footer-nav-link transition-all duration-300 font-medium">
                  Cookies
                </Link>
                <div className="flex items-center space-x-1 text-white/50">
                  <span>v2.1.0</span>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
