
import React, { useState, useEffect } from 'react';
import './Header.css';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'glass-dark backdrop-blur-xl border-b border-purple-500/20' 
        : 'bg-transparent'
    }`}>
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-glow">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-2xl font-bold gradient-text">
              LaptopVerse
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
              Home
            </a>
            <a href="#compare" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
              Compare
            </a>
            <a href="#brands" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
              Brands
            </a>
            <a href="#deals" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
              Deals
            </a>
            <a href="#reviews" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
              Reviews
            </a>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search laptops..."
                className="w-full px-4 py-2 pl-10 pr-4 glass rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button className="cosmic-button px-6 py-2 rounded-xl text-white font-semibold">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 glass-dark rounded-xl">
            <div className="flex flex-col space-y-3 px-4 py-4">
              <a href="#home" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
                Home
              </a>
              <a href="#compare" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
                Compare
              </a>
              <a href="#brands" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
                Brands
              </a>
              <a href="#deals" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
                Deals
              </a>
              <a href="#reviews" className="text-white/90 hover:text-purple-400 transition-colors duration-300 font-medium">
                Reviews
              </a>
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Search laptops..."
                  className="w-full px-4 py-2 glass rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <button className="cosmic-button px-6 py-2 rounded-xl text-white font-semibold mt-2">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
