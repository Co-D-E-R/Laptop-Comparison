import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface Suggestion {
  id: string;
  title: string;
  brand: string;
  series: string;
  processor: string;
  ram: string;
  storage: string;
  price: number;
  image: string;
}

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const debounceTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }

      // Handle click outside suggestions
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    if (showUserMenu || showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showSuggestions]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []); // Fetch suggestions with debouncing
  const fetchSuggestions = useCallback(async (query: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }

    // Debounce the API call
    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/suggestions?query=${encodeURIComponent(
            query
          )}`
        );
        const data = await response.json();

        // Check if response is successful and has suggestions
        if (!data.success || !Array.isArray(data.suggestions)) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        // Remove duplicates based on brand + series combination
        const uniqueSuggestions = data.suggestions.filter(
          (suggestion: Suggestion, index: number, self: Suggestion[]) => {
            const key = `${suggestion.brand} ${suggestion.series}`
              .toLowerCase()
              .trim();
            return (
              index ===
              self.findIndex(
                (s) => `${s.brand} ${s.series}`.toLowerCase().trim() === key
              )
            );
          }
        );

        // Limit suggestions based on screen size
        const maxSuggestions = window.innerWidth < 768 ? 5 : 8;
        setSuggestions(uniqueSuggestions.slice(0, maxSuggestions));
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce
  }, []);
  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (
        selectedSuggestionIndex >= 0 &&
        suggestions[selectedSuggestionIndex]
      ) {
        // Select the highlighted suggestion
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else {
        // Regular search
        handleSearch(e);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchSuggestions(value);
  };
  const handleSuggestionClick = (suggestion: Suggestion) => {
    const searchTerm = `${suggestion.brand} ${suggestion.series}`.trim();
    setSearchQuery(searchTerm);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };
  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-dark backdrop-blur-xl border-b border-purple-500/20"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-glow">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <h1
              className="text-2xl font-bold gradient-text cursor-pointer"
              onClick={() => navigate("/")}
            >
              LaptopVerse
            </h1>
          </div>{" "}
          {/* Enhanced Search Bar with Smart Suggestions */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="relative w-full max-w-2xl">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search laptops, brands, processors..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleSearchKeyPress}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="w-full px-4 py-3 pl-12 pr-4 glass rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 text-sm"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>

                {/* Smart Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-2 glass-dark rounded-xl border border-purple-500/30 shadow-2xl z-50 max-h-96 overflow-y-auto backdrop-blur-xl"
                  >
                    <div className="p-2">
                      <div className="text-xs text-white/60 px-3 py-2 font-medium">
                        💡 Smart Suggestions
                      </div>{" "}
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={suggestion.id}
                          className={`p-3 transition-all duration-200 cursor-pointer border-b border-purple-500/10 last:border-b-0 rounded-lg mx-1 group ${
                            index === selectedSuggestionIndex
                              ? "bg-purple-500/30 border-purple-400/50"
                              : "hover:bg-purple-500/20"
                          }`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-purple-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm group-hover:text-purple-300 transition-colors">
                                  {suggestion.brand} {suggestion.series}
                                </h4>
                                <div className="flex items-center space-x-2 text-xs text-white/50 mt-1">
                                  <span>{suggestion.brand}</span>
                                </div>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg
                                className="w-4 h-4 text-purple-400"
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
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* View All Results Link */}
                      <div className="border-t border-purple-500/20 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setShowSuggestions(false);
                            navigate(
                              `/search?q=${encodeURIComponent(searchQuery)}`
                            );
                          }}
                          className="w-full p-3 text-center text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                          🔍 View all results for "{searchQuery}"
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
          {/* User Menu or Login/Signup Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {" "}
            {!isLoading && user ? (
              <div className="relative user-menu" ref={userMenuRef}>
                <button
                  className="flex items-center space-x-2 cosmic-button px-4 py-2 rounded-xl text-white font-semibold"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{user.name}</span>
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>{" "}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-dark rounded-xl border border-purple-500/30 shadow-xl">
                    <div className="px-4 py-3 border-b border-purple-500/30">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-white/60 text-sm">{user.email}</p>
                    </div>
                    <button
                      className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/20 transition-colors border-b border-purple-500/30"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/profile");
                      }}
                    >
                      Profile
                    </button>
                    <button
                      className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/20 transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}{" "}
              </div>
            ) : (
              <button
                className="px-6 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border border-indigo-500/30 shadow-lg transition-all duration-300 hover:shadow-indigo-500/25 hover:-translate-y-0.5"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            )}
          </div>{" "}
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>{" "}
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 glass-dark rounded-xl">
            <div className="flex flex-col space-y-3 px-4 py-4">
              {" "}
              <div className="pt-2">
                <div className="relative">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      placeholder="Search laptops, brands, processors..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onKeyPress={handleSearchKeyPress}
                      onFocus={handleSearchFocus}
                      onBlur={handleSearchBlur}
                      className="w-full px-4 py-3 pl-12 glass rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <button
                      type="submit"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </form>

                  {/* Mobile Smart Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 glass-dark rounded-xl border border-purple-500/30 shadow-2xl z-50 max-h-80 overflow-y-auto backdrop-blur-xl">
                      <div className="p-2">
                        <div className="text-xs text-white/60 px-3 py-2 font-medium">
                          💡 Smart Suggestions
                        </div>{" "}
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.id}
                            className={`p-3 transition-all duration-200 cursor-pointer border-b border-purple-500/10 last:border-b-0 rounded-lg mx-1 group ${
                              index === selectedSuggestionIndex
                                ? "bg-purple-500/30 border-purple-400/50"
                                : "hover:bg-purple-500/20"
                            }`}
                            onClick={() => {
                              handleSuggestionClick(suggestion);
                              setIsMobileMenuOpen(false);
                            }}
                            onMouseEnter={() =>
                              setSelectedSuggestionIndex(index)
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-purple-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium text-sm group-hover:text-purple-300 transition-colors">
                                    {suggestion.brand} {suggestion.series}
                                  </h4>
                                  <div className="text-xs text-white/50 mt-1">
                                    {suggestion.brand}
                                  </div>
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg
                                  className="w-4 h-4 text-purple-400"
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
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* View All Results Link */}
                        <div className="border-t border-purple-500/20 mt-2 pt-2">
                          <button
                            onClick={() => {
                              setShowSuggestions(false);
                              setIsMobileMenuOpen(false);
                              navigate(
                                `/search?q=${encodeURIComponent(searchQuery)}`
                              );
                            }}
                            className="w-full p-3 text-center text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all duration-200 text-sm font-medium"
                          >
                            🔍 View all results for "{searchQuery}"
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!isLoading && user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 px-2 py-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-white/60 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <button
                    className="w-full cosmic-button px-6 py-2 rounded-xl text-white font-semibold"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>{" "}
                </div>
              ) : (
                <button
                  className="px-6 py-2 rounded-xl text-white font-semibold mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border border-indigo-500/30 shadow-lg transition-all duration-300"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
