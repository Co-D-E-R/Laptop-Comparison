import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import { useCompare } from "../../hooks/useCompare";
import { FavoriteButton } from "../../components/FavoriteButton";

interface SuggestionItem {
  id: string;
  title: string;
  brand: string;
  series: string;
  processor: string;
  ram: string;
  storage: string;
  price: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  bestRatingSite?: string;
  sites?: Array<{
    source: string;
    price: number;
    link: string;
    rating: number;
    ratingCount: string | number;
    basePrice: number;
  }>;
}

interface Laptop {
  _id: string;
  brand: string;
  series: string;
  specs: {
    head: string;
    brand: string;
    series: string;
    processor: {
      name: string;
      gen: string;
      variant: string;
    };
    ram: {
      size: string;
      type: string;
    };
    storage: {
      size: string;
      type: string;
    };
    details: {
      imageLinks: string[];
    };
    displayInch: number;
    gpu: string;
    basePrice: number;
    ratingCount: string;
  };
  sites: Array<{
    source: string;
    price: number;
    link: string;
    rating: number;
    ratingCount: string;
    basePrice: number;
  }>;
  allTimeLowPrice: number;
}

interface SearchResponse {
  success: boolean;
  laptops: Laptop[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Filters {
  brands: string[];
  processors: string[];
  rams: string[];
  storage: string[];
  gpu: string[];
  screenSizes: string[];
  customerReview: string;
  priceRange: string;
}

// Utility function to format storage size with proper units
const formatStorageSize = (size: string | number): string => {
  const numSize = typeof size === "string" ? parseInt(size) : size;

  // If size is less than 10, treat as TB; otherwise treat as GB
  if (numSize < 10) {
    return `${numSize}TB`;
  } else {
    // For values >= 1000, convert to TB
    if (numSize >= 1000) {
      const tbSize = numSize / 1000;
      return `${tbSize}TB`;
    }
    return `${numSize}GB`;
  }
};

// Utility function to convert screen size from CM to inches if needed
const convertScreenSize = (size: string | number): string => {
  const numSize = typeof size === "string" ? parseFloat(size) : size;

  // If size is greater than 20, it's likely in CM, convert to inches
  if (numSize > 20) {
    return (numSize / 2.54).toFixed(1);
  }
  return numSize.toString();
};

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } =
    useCompare();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [filters, setFilters] = useState<Filters>({
    brands: [],
    processors: [],
    rams: [],
    storage: [],
    gpu: [],
    screenSizes: [],
    customerReview: "",
    priceRange: "",
  });

  // Scroll to top when component mounts, search query changes, pagination changes, or filter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, pagination?.page, filters]);

  // Handle laptop click navigation and add to history
  const handleLaptopClick = async (laptop: Laptop) => {
    // Navigate to laptop detail page
    navigate(`/laptop/${laptop._id}`);

    // Add to user history if user is authenticated
    if (user) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            laptopId: laptop._id,
          }),
        });
      } catch (historyError) {
        console.error("Error adding to history:", historyError);
      }
    }
  };

  // Handle adding laptop to comparison
  const handleAddToCompare = (e: React.MouseEvent, laptop: Laptop) => {
    e.stopPropagation(); // Prevent laptop card click
    const success = addToCompare(laptop);
    if (!success) {
      // Could show a notification here that comparison is full or laptop already added
      console.log(
        "Cannot add laptop to compare - either full or already added"
      );
    }
  };

  // Handle removing laptop from comparison
  const handleRemoveFromCompare = (e: React.MouseEvent, laptopId: string) => {
    e.stopPropagation(); // Prevent laptop card click
    removeFromCompare(laptopId);
  };

  // Check if any filters are applied
  const hasFiltersApplied = (filters: Filters) => {
    return (
      filters.brands.length > 0 ||
      filters.processors.length > 0 ||
      filters.rams.length > 0 ||
      filters.storage.length > 0 ||
      filters.gpu.length > 0 ||
      filters.screenSizes.length > 0 ||
      filters.customerReview !== "" ||
      filters.priceRange !== ""
    );
  };

  // Utility function to get the best rating from laptop sites
  const getBestRating = (laptop: Laptop): { rating: number | null; reviewCount: string; siteName: string } => {
    if (!laptop.sites || laptop.sites.length === 0) {
      return { rating: null, reviewCount: "0", siteName: "" };
    }

    // Find sites with valid ratings
    const sitesWithRatings = laptop.sites.filter(
      site => site.rating && typeof site.rating === 'number' && site.rating > 0
    );

    if (sitesWithRatings.length === 0) {
      return { rating: null, reviewCount: "0", siteName: "" };
    }

    // Find the site with the highest rating
    const bestSite = sitesWithRatings.reduce((best, current) => {
      return current.rating > best.rating ? current : best;
    });

    // Get review count from the best rated site only
    let reviewCount = 0;
    if (bestSite.ratingCount && bestSite.ratingCount !== "N/A") {
      // Handle both string and number types for ratingCount
      if (typeof bestSite.ratingCount === 'string') {
        // Remove commas and parse string number
        reviewCount = parseInt(bestSite.ratingCount.replace(/,/g, ""));
      } else if (typeof bestSite.ratingCount === 'number') {
        // Already a number
        reviewCount = bestSite.ratingCount;
      }
    }

    return { 
      rating: bestSite.rating, 
      reviewCount: reviewCount > 0 ? reviewCount.toLocaleString() : "0",
      siteName: bestSite.source === 'amazon' ? 'Amazon' : 'Flipkart'
    };
  };

  // Utility function to render star rating
  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400">★</span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400">☆</span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-400">☆</span>
        );
      }
    }

    return <>{stars}</>;
  };
  // Fetch search results using suggestions API (for direct searches without filters)
  const fetchSuggestionsResults = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/suggestions?query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();

      console.log("Suggestions API Response:", data); // Debug log

      if (data.success && Array.isArray(data.suggestions)) {
        // Transform suggestions API response to match our Laptop interface
        const transformedLaptops: Laptop[] = data.suggestions.map(
          (item: SuggestionItem) => ({
            _id: item.id,
            brand: item.brand || "Unknown Brand",
            series: item.series || "Unknown Series",
            specs: {
              head: item.title || "Unknown Model",
              brand: item.brand || "Unknown Brand",
              series: item.series || "Unknown Series",
              processor: {
                name: item.processor?.split(" ")[0] || "Unknown",
                gen: item.processor?.match(/(\d+)th Gen/)?.[1] || "",
                variant: item.processor?.split(" ").slice(1).join(" ") || "",
              },
              ram: {
                size: item.ram?.match(/(\d+)GB/)?.[1] || "0",
                type: item.ram?.match(/DDR\d+/i)?.[0] || "Unknown",
              },
              storage: {
                size: item.storage?.match(/(\d+)GB/)?.[1] || "0",
                type: item.storage?.match(/(SSD|HDD|EMMC)/i)?.[0] || "Unknown",
              },
              details: {
                imageLinks: item.image ? [item.image] : [],
              },
              displayInch: 15.6, // Default value since suggestions API doesn't provide this
              gpu: "Unknown",
              basePrice: item.price || 0,
              ratingCount: item.reviewCount?.toString() || "0",
            },
            sites: item.sites && item.sites.length > 0 
              ? item.sites.map((site) => ({
                  source: site.source,
                  price: site.price,
                  link: site.link || "",
                  rating: site.rating || 0,
                  ratingCount: site.ratingCount?.toString() || "0",
                  basePrice: site.basePrice || site.price,
                }))
              : (item.price ? [
                  {
                    source: "amazon",
                    price: item.price,
                    link: "",
                    rating: item.rating || 0,
                    ratingCount: item.reviewCount?.toString() || "0",
                    basePrice: item.price,
                  },
                ] : []),
            allTimeLowPrice: item.price || 0,
          })
        );

        setLaptops(transformedLaptops);
        // Use pagination data from API response
        setPagination({
          total: data.pagination?.total || transformedLaptops.length,
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || transformedLaptops.length,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch (error) {
      console.error("Error fetching suggestions results:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch search results using advanced search API (for filtered searches)
  const fetchAdvancedSearchResults = useCallback(
    async (query: string, currentFilters: Filters, page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        // Only include query if no specific filters are applied
        // When any meaningful filters are applied, they replace the query entirely
        // customerReview and priceRange can work alongside text queries
        const hasSpecificFilters =
          currentFilters.brands.length > 0 ||
          currentFilters.processors.length > 0 ||
          currentFilters.rams.length > 0 ||
          currentFilters.storage.length > 0 ||
          currentFilters.gpu.length > 0 ||
          currentFilters.screenSizes.length > 0;

        if (query && !hasSpecificFilters) {
          const formattedQuery = query.trim().split(/\s+/).join(" && ");
          params.append("query", formattedQuery);
        }

        if (currentFilters.brands.length > 0) {
          currentFilters.brands.forEach((brand) =>
            params.append("laptop_model", brand)
          );
        }
        if (currentFilters.processors.length > 0) {
          // Map frontend processor names to backend values
          const processorMap: { [key: string]: string } = {
            "Intel Core i3": "i3",
            "Intel Core i5": "i5",
            "Intel Core i7": "i7",
            "Intel Core i9": "i9",
            "AMD Ryzen 3": "ryzen3",
            "AMD Ryzen 5": "ryzen5",
            "AMD Ryzen 7": "ryzen7",
          };

          // Append each processor as a separate parameter for OR logic
          currentFilters.processors.forEach((processor) => {
            const backendProcessor = processorMap[processor] || processor;
            params.append("processor", backendProcessor);
          });
        }
        if (currentFilters.rams.length > 0) {
          // Convert multiple RAM sizes to comma-separated string for OR logic
          const ramSizes = currentFilters.rams
            .map((ram) => ram.replace("GB", ""))
            .join(",");

          params.append("ram", ramSizes);
        }
        if (currentFilters.screenSizes.length > 0) {
          currentFilters.screenSizes.forEach((size) => {
            // Map size ranges to actual numeric values
            const sizeMap: { [key: string]: string[] } = {
              "13-14 inch": ["13.3", "14"],
              "15-16 inch": ["15.6"],
              "17+ inch": ["17.3"], // Backend will handle >= 17 logic
            };
            const numericSizes = sizeMap[size] || [size];
            numericSizes.forEach((numSize) =>
              params.append("screen_size", numSize)
            );
          });
        }
        if (currentFilters.storage.length > 0) {
          currentFilters.storage.forEach((storage) =>
            params.append("storage", storage)
          );
        }
        if (currentFilters.gpu.length > 0) {
          currentFilters.gpu.forEach((gpu) => params.append("gpu", gpu));
        }
        if (currentFilters.customerReview) {
          params.append("rating_min", currentFilters.customerReview);
        }
        if (currentFilters.priceRange) {
          const [min, max] = currentFilters.priceRange.split("-");
          if (min && min !== "0" && min.trim() !== "") {
            params.append("price_min", min);
          }
          if (max && max.trim() !== "") {
            params.append("price_max", max);
          }
        }
        params.append("page", page.toString());
        params.append("limit", "20");

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/advancedsearch?${params}`
        );
        const data: SearchResponse = await response.json();

        console.log("Advanced Search API Response:", data); // Debug log
        console.log("Search Parameters:", params.toString()); // Debug log

        if (data.success) {
          setLaptops(data.laptops);
          setPagination(data.pagination);
        } else {
          console.error("Advanced Search API returned success: false");
        }
      } catch (error) {
        console.error("Error fetching advanced search results:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Main search function that decides which API to use
  const fetchSearchResults = useCallback(
    async (query: string, currentFilters: Filters, page = 1) => {
      if (!query && !hasFiltersApplied(currentFilters)) {
        // No query and no filters - clear results
        setLaptops([]);
        setPagination(null);
        return;
      }

      if (hasFiltersApplied(currentFilters)) {
        // Use advanced search API when filters are applied
        await fetchAdvancedSearchResults(query, currentFilters, page);
      } else if (query) {
        // Use suggestions API for direct search queries without filters
        await fetchSuggestionsResults(query);
      }
    },
    [fetchAdvancedSearchResults, fetchSuggestionsResults]
  );

  // Handle filter change
  const handleFilterChange = (
    filterType: keyof Filters,
    value: string,
    checked?: boolean
  ) => {
    const newFilters = { ...filters };

    if (filterType === "customerReview" || filterType === "priceRange") {
      newFilters[filterType] = value;
    } else {
      const filterArray = newFilters[filterType] as string[];
      if (checked) {
        newFilters[filterType] = [...filterArray, value];
      } else {
        newFilters[filterType] = filterArray.filter((item) => item !== value);
      }
    }

    setFilters(newFilters);
    fetchSearchResults(searchQuery, newFilters);
  }; // Initial search on page load
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      // Use empty filters for initial load to prevent infinite loop
      fetchSearchResults(query, {
        brands: [],
        processors: [],
        rams: [],
        storage: [],
        gpu: [],
        screenSizes: [],
        customerReview: "",
        priceRange: "",
      });
    }
  }, [searchParams, fetchSearchResults]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] via-[#2d1b4d] to-[#1a2a4f] text-white">
      <Header />

      <div className="pt-24 px-6">
        <div className="container mx-auto">
          {/* Enhanced Hero Section */}
          <div className="mb-12 text-center">
            <div className="relative">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4 animate-pulse">
                Discover Your Perfect Laptop
              </h1>
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-100"></div>
              <div className="absolute -bottom-1 left-1/4 w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
            </div>

            {searchQuery && (
              <div className="mt-6 inline-flex items-center space-x-3 glass-dark px-6 py-3 rounded-full border border-purple-500/30">
                <span className="text-lg text-white/80">Searching for:</span>
                <span className="text-xl font-semibold text-purple-400">
                  "{searchQuery}"
                </span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setLaptops([]);
                    setPagination(null);
                  }}
                  className="ml-2 text-white/60 hover:text-white transition-colors"
                  title="Clear search"
                >
                  ✕
                </button>
              </div>
            )}

            <p className="text-xl text-white/60 mt-4 max-w-2xl mx-auto">
              Explore thousands of laptops with advanced filters and find the
              one that matches your needs perfectly
            </p>
          </div>{" "}
          <div className="flex gap-8">
            {/* Enhanced Filters Sidebar */}
            <div className="w-80 glass-dark rounded-2xl p-6 h-fit sticky top-32 border border-purple-500/20 backdrop-blur-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-2">🔍</span>
                  Smart Filters
                </h3>
                <button
                  onClick={() => {
                    setFilters({
                      brands: [],
                      processors: [],
                      rams: [],
                      storage: [],
                      gpu: [],
                      screenSizes: [],
                      customerReview: "",
                      priceRange: "",
                    });
                    fetchSearchResults(searchQuery, {
                      brands: [],
                      processors: [],
                      rams: [],
                      storage: [],
                      gpu: [],
                      screenSizes: [],
                      customerReview: "",
                      priceRange: "",
                    });
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors hover:bg-purple-500/20 px-3 py-1 rounded-lg"
                >
                  Clear All
                </button>
              </div>

              {/* Brand Filter */}
              <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">🏢</span>
                  Brand
                  {filters.brands.length > 0 && (
                    <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      {filters.brands.length}
                    </span>
                  )}
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {["HP", "Dell", "Lenovo", "Asus", "Acer", "Apple", "MSI"].map(
                    (brand) => (
                      <label
                        key={brand}
                        className="flex items-center space-x-3 cursor-pointer group hover:bg-purple-500/20 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-purple-500/30"
                      >
                        <input
                          type="checkbox"
                          checked={filters.brands.includes(brand)}
                          onChange={(e) =>
                            handleFilterChange(
                              "brands",
                              brand,
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 rounded border-purple-500/30 bg-transparent text-purple-500 focus:ring-purple-500/50 focus:ring-2"
                        />
                        <span className="text-white/80 group-hover:text-white transition-colors flex-1">
                          {brand}
                        </span>
                        <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ✓
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Processor Filter */}
              <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-xl border border-blue-500/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">⚡</span>
                  Processor
                  {filters.processors.length > 0 && (
                    <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {filters.processors.length}
                    </span>
                  )}
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {[
                    "Intel Core i3",
                    "Intel Core i5",
                    "Intel Core i7",
                    "Intel Core i9",
                    "AMD Ryzen 3",
                    "AMD Ryzen 5",
                    "AMD Ryzen 7",
                  ].map((processor) => (
                    <label
                      key={processor}
                      className="flex items-center space-x-3 cursor-pointer group hover:bg-blue-500/20 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-500/30"
                    >
                      <input
                        type="checkbox"
                        checked={filters.processors.includes(processor)}
                        onChange={(e) =>
                          handleFilterChange(
                            "processors",
                            processor,
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 rounded border-blue-500/30 bg-transparent text-blue-500 focus:ring-blue-500/50 focus:ring-2"
                      />
                      <span className="text-white/80 group-hover:text-white transition-colors text-sm flex-1">
                        {processor}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* RAM Filter */}
              <div className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">🧠</span>
                  RAM
                  {filters.rams.length > 0 && (
                    <span className="ml-auto bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {filters.rams.length}
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {["4GB", "8GB", "16GB", "32GB"].map((ram) => (
                    <label
                      key={ram}
                      className="flex items-center space-x-2 cursor-pointer group hover:bg-green-500/20 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-green-500/30"
                    >
                      <input
                        type="checkbox"
                        checked={filters.rams.includes(ram)}
                        onChange={(e) =>
                          handleFilterChange("rams", ram, e.target.checked)
                        }
                        className="w-4 h-4 rounded border-green-500/30 bg-transparent text-green-500 focus:ring-green-500/50 focus:ring-2"
                      />
                      <span className="text-white/80 group-hover:text-white transition-colors text-sm">
                        {ram}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Storage Filter */}
              <div className="mb-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-4 rounded-xl border border-yellow-500/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">💾</span>
                  Storage
                  {filters.storage.length > 0 && (
                    <span className="ml-auto bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                      {filters.storage.length}
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {["256GB", "512GB", "1TB", "2TB"].map(
                    (storage) => (
                      <label
                        key={storage}
                        className="flex items-center space-x-2 cursor-pointer group hover:bg-yellow-500/20 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/30"
                      >
                        <input
                          type="checkbox"
                          checked={filters.storage.includes(storage)}
                          onChange={(e) =>
                            handleFilterChange(
                              "storage",
                              storage,
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 rounded border-yellow-500/30 bg-transparent text-yellow-500 focus:ring-yellow-500/50 focus:ring-2"
                        />
                        <span className="text-white/80 group-hover:text-white transition-colors text-sm">
                          {storage}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Screen Size Filter */}
              <div className="mb-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-xl border border-orange-500/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">📺</span>
                  Screen Size
                  {filters.screenSizes.length > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      {filters.screenSizes.length}
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  {["13-14 inch", "15-16 inch", "17+ inch"].map((size) => (
                    <label
                      key={size}
                      className="flex items-center space-x-3 cursor-pointer group hover:bg-orange-500/20 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-orange-500/30"
                    >
                      <input
                        type="checkbox"
                        checked={filters.screenSizes.includes(size)}
                        onChange={(e) =>
                          handleFilterChange(
                            "screenSizes",
                            size,
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 rounded border-orange-500/30 bg-transparent text-orange-500 focus:ring-orange-500/50 focus:ring-2"
                      />
                      <span className="text-white/80 group-hover:text-white transition-colors flex-1">
                        {size}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* GPU Filter */}
              <div className="mb-6 bg-gradient-to-r from-red-500/10 to-rose-500/10 p-4 rounded-xl border border-red-500/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">🎮</span>
                  Graphics (GPU)
                  {filters.gpu.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {filters.gpu.length}
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {["RTX", "GTX"].map((gpu) => (
                    <label
                      key={gpu}
                      className="flex items-center space-x-2 cursor-pointer group hover:bg-red-500/20 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
                    >
                      <input
                        type="checkbox"
                        checked={filters.gpu.includes(gpu)}
                        onChange={(e) =>
                          handleFilterChange("gpu", gpu, e.target.checked)
                        }
                        className="w-4 h-4 rounded border-red-500/30 bg-transparent text-red-500 focus:ring-red-500/50 focus:ring-2"
                      />
                      <span className="text-white/80 group-hover:text-white transition-colors text-sm">
                        {gpu}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Customer Review Filter */}
              <div className="mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-xl border border-yellow-500/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">⭐</span>
                  Customer Review
                  {filters.customerReview && (
                    <span className="ml-auto bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                      {filters.customerReview}+
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "4+ Stars", value: "4", stars: "⭐⭐⭐⭐" },
                    { label: "3+ Stars", value: "3", stars: "⭐⭐⭐" },
                    { label: "2+ Stars", value: "2", stars: "⭐⭐" },
                    { label: "1+ Stars", value: "1", stars: "⭐" },
                  ].map((rating) => (
                    <label
                      key={rating.value}
                      className="flex items-center space-x-3 cursor-pointer group hover:bg-yellow-500/20 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/30"
                    >
                      <input
                        type="radio"
                        name="customerReview"
                        checked={filters.customerReview === rating.value}
                        onChange={() =>
                          handleFilterChange("customerReview", rating.value)
                        }
                        onClick={(e) => {
                          // Allow unchecking radio button if it's already selected
                          if (filters.customerReview === rating.value) {
                            e.preventDefault();
                            handleFilterChange("customerReview", "");
                          }
                        }}
                        className="w-4 h-4 border-yellow-500/30 bg-transparent text-yellow-500 focus:ring-yellow-500/50 focus:ring-2"
                      />
                      <span className="text-white/80 group-hover:text-white transition-colors flex-1">
                        {rating.label}
                      </span>
                      <span className="text-yellow-400 text-sm">
                        {rating.stars}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 rounded-xl border border-emerald-500/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">💰</span>
                  Price Range
                  {filters.priceRange && (
                    <span className="ml-auto bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                      ₹
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      label: "Under ₹30,000",
                      value: "0-30000",
                      color: "text-green-400",
                    },
                    {
                      label: "₹30,000 - ₹50,000",
                      value: "30000-50000",
                      color: "text-blue-400",
                    },
                    {
                      label: "₹50,000 - ₹80,000",
                      value: "50000-80000",
                      color: "text-yellow-400",
                    },
                    {
                      label: "₹80,000 - ₹1,20,000",
                      value: "80000-120000",
                      color: "text-orange-400",
                    },
                    {
                      label: "Above ₹1,20,000",
                      value: "120000-",
                      color: "text-red-400",
                    },
                  ].map((price) => (
                    <label
                      key={price.value}
                      className="flex items-center space-x-3 cursor-pointer group hover:bg-emerald-500/20 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-emerald-500/30"
                    >
                      <input
                        type="radio"
                        name="priceRange"
                        checked={filters.priceRange === price.value}
                        onChange={() =>
                          handleFilterChange("priceRange", price.value)
                        }
                        onClick={(e) => {
                          // Allow unchecking radio button if it's already selected
                          if (filters.priceRange === price.value) {
                            e.preventDefault();
                            handleFilterChange("priceRange", "");
                          }
                        }}
                        className="w-4 h-4 border-emerald-500/30 bg-transparent text-emerald-500 focus:ring-emerald-500/50 focus:ring-2"
                      />
                      <span
                        className={`group-hover:text-white transition-colors ${price.color} flex-1`}
                      >
                        {price.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>{" "}
            {/* Enhanced Search Results */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-20">
                  <div className="relative">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500"></div>
                    <div className="absolute inset-0 inline-block animate-pulse rounded-full h-16 w-16 border-4 border-pink-500/20 border-r-pink-500"></div>
                  </div>
                  <p className="text-white/60 mt-6 text-lg">
                    🔍 Searching for the perfect laptops...
                  </p>
                  <div className="flex justify-center space-x-1 mt-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Enhanced Results Header */}
                  {pagination && (
                    <div className="mb-8 glass-dark rounded-xl p-6 border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-3xl font-bold text-white mb-2">
                            {searchQuery ? (
                              <>
                                Results for{" "}
                                <span className="text-purple-400">
                                  "{searchQuery}"
                                </span>
                              </>
                            ) : (
                              "All Laptops"
                            )}
                          </h2>
                          <p className="text-white/60 flex items-center">
                            <span className="text-purple-400 font-semibold mr-1">
                              {pagination.total}
                            </span>
                            laptops found • Page {pagination.page} of{" "}
                            {pagination.totalPages}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white/60">
                            Showing{" "}
                            {(pagination.page - 1) * pagination.limit + 1}-
                            {Math.min(
                              pagination.page * pagination.limit,
                              pagination.total
                            )}{" "}
                            of {pagination.total}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Results Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {laptops.map((laptop, index) => (
                      <div
                        key={laptop._id}
                        className="group glass-dark rounded-2xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: "fadeInUp 0.6s ease-out forwards",
                        }}
                        onClick={() => handleLaptopClick(laptop)}
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={
                              laptop.specs?.details?.imageLinks?.[0] ||
                              "/placeholder-laptop.jpg"
                            }
                            alt={laptop.specs?.head || "Laptop"}
                            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-laptop.jpg";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          {/* Compare Button - Shows on Hover */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            {isInCompare(laptop._id) ? (
                              <button
                                onClick={(e) =>
                                  handleRemoveFromCompare(e, laptop._id)
                                }
                                className="bg-red-500/90 hover:bg-red-600/90 text-white px-4 py-2 rounded-lg font-semibold backdrop-blur-sm border border-red-400/50 transition-all duration-300 flex items-center gap-2"
                              >
                                <span>✓</span>
                                Remove from Compare
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleAddToCompare(e, laptop)}
                                disabled={!canAddMore}
                                className={`${
                                  canAddMore
                                    ? "bg-purple-500/90 hover:bg-purple-600/90 text-white"
                                    : "bg-gray-500/90 text-gray-300 cursor-not-allowed"
                                } px-4 py-2 rounded-lg font-semibold backdrop-blur-sm border border-purple-400/50 transition-all duration-300 flex items-center gap-2`}
                              >
                                <span>⚖️</span>
                                {canAddMore ? "Add to Compare" : "Compare Full"}
                              </button>
                            )}
                          </div>

                          {/* Rating badge removed - moved to bottom section */}

                          {/* Favorite Button */}
                          <div className="absolute top-4 left-4 z-10">
                            <div className="flex flex-col gap-2">
                              <div className="bg-purple-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                                {laptop.brand || laptop.specs?.brand}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <FavoriteButton
                                  laptopId={laptop._id}
                                  size="small"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Compare Status Indicator */}
                          {isInCompare(laptop._id) && (
                            <div className="absolute bottom-4 right-4 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-green-400/50">
                              In Compare
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                            {laptop.specs?.head || "Unknown Laptop"}
                          </h3>

                          <div className="grid grid-cols-2 gap-3 text-sm text-white/80 mb-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400">⚡</span>
                              <span className="truncate">
                                {laptop.specs?.processor
                                  ? `${laptop.specs.processor.name} ${laptop.specs.processor.gen}th Gen`
                                  : "Unknown Processor"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-green-400">🧠</span>
                              <span>
                                {laptop.specs?.ram
                                  ? `${
                                      laptop.specs.ram.size
                                    }GB ${laptop.specs.ram.type.toUpperCase()}`
                                  : "Unknown RAM"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-orange-400">💾</span>
                              <span className="truncate">
                                {laptop.specs?.storage
                                  ? `${formatStorageSize(
                                      laptop.specs.storage.size
                                    )} ${laptop.specs.storage.type.toUpperCase()}`
                                  : "Unknown Storage"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-pink-400">🖥️</span>
                              <span className="truncate">
                                {laptop.specs?.displayInch
                                  ? `${convertScreenSize(
                                      laptop.specs.displayInch
                                    )}"`
                                  : "Unknown Display"}
                              </span>
                            </div>
                          </div>

                          {/* Rating Display */}
                          {(() => {
                            const { rating, reviewCount } = getBestRating(laptop);
                            if (rating && rating > 0) {
                              return (
                                <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                      {renderStarRating(rating)}
                                    </div>
                                    <span className="text-yellow-400 font-semibold text-sm">
                                      {rating.toFixed(1)}
                                    </span>
                                  </div>
                                  <span className="text-white/60 text-xs">
                                    {reviewCount} reviews
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                ₹
                                {(() => {
                                  // Extract lowest price from sites array
                                  if (laptop.sites && laptop.sites.length > 0) {
                                    const prices = laptop.sites
                                      .map((site) => site.price)
                                      .filter(
                                        (price): price is number =>
                                          typeof price === "number" && price > 0
                                      );
                                    if (prices.length > 0) {
                                      return Math.min(
                                        ...prices
                                      ).toLocaleString();
                                    }
                                  }
                                  // Fallback to allTimeLowPrice
                                  if (
                                    laptop.allTimeLowPrice &&
                                    laptop.allTimeLowPrice > 0
                                  ) {
                                    return laptop.allTimeLowPrice.toLocaleString();
                                  }
                                  return "N/A";
                                })()}
                              </p>
                              <p className="text-xs text-white/60 mt-1">
                                Best Price
                              </p>
                            </div>
                            <button className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Enhanced Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-6 mt-12">
                      <button
                        onClick={() =>
                          fetchSearchResults(
                            searchQuery,
                            filters,
                            pagination.page - 1
                          )
                        }
                        disabled={!pagination.hasPrev}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          pagination.hasPrev
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
                            : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        ← Previous
                      </button>

                      <div className="flex items-center space-x-2">
                        {[...Array(Math.min(5, pagination.totalPages))].map(
                          (_, i) => {
                            const pageNum =
                              Math.max(1, pagination.page - 2) + i;
                            if (pageNum > pagination.totalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() =>
                                  fetchSearchResults(
                                    searchQuery,
                                    filters,
                                    pageNum
                                  )
                                }
                                className={`w-12 h-12 rounded-xl font-semibold transition-all duration-300 ${
                                  pageNum === pagination.page
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                                    : "glass-dark text-white/80 hover:text-white hover:bg-purple-500/20"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        onClick={() =>
                          fetchSearchResults(
                            searchQuery,
                            filters,
                            pagination.page + 1
                          )
                        }
                        disabled={!pagination.hasNext}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          pagination.hasNext
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
                            : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
