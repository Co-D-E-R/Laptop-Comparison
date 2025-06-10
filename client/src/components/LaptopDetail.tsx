import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTechAssistant } from "../contexts/TechAssistantContext";
import { useCompare } from "../hooks/useCompare";
import { FavoriteButton } from "./FavoriteButton/FavoriteButton";
import { formatStorage } from "../utils/storageUtils";
import "./LaptopDetail.css";

interface LaptopData {
  _id: string;
  brand: string;
  series: string;
  specs: {
    head: string;
    processor: {
      name: string;
      gen: string;
      variant: string;
    };
    ram: {
      size: number;
      type: string;
    };
    storage: {
      size: number;
      type: string;
    };
    displayInch: number;
    gpu: string;
    gpuVersion?: string;
    touch?: boolean;
    details?: {
      imageLinks?: string[];
    };
  };
  sites: Array<{
    source: "amazon" | "flipkart";
    price: number;
    link: string;
    rating: number;
    ratingCount: number;
    basePrice?: number;
  }>;
  allTimeLowPrice: number;
}

const LaptopDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentLaptop } = useTechAssistant();
  const { addToCompare, removeFromCompare, canAddMore, isInCompare } = useCompare();
  const [laptop, setLaptop] = useState<LaptopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true); // Auto-slide functionality
  useEffect(() => {
    const imageLinks = laptop?.specs?.details?.imageLinks;
    if (!isAutoSliding || !imageLinks || imageLinks.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageLinks.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoSliding, laptop?.specs?.details?.imageLinks]);

  useEffect(() => {
    const fetchLaptopDetails = async () => {
      if (!productId) {
        setError("Product ID not found");
        setLoading(false);
        return;
      }

      try {
        // Fetch laptop details using the correct API endpoint
        const response = await fetch(`/api/laptop/${productId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch laptop details");
        }
        const data = await response.json();
        if (data.success && data.laptop) {
          setLaptop(data.laptop);
          // Set current laptop for TechAssistant context
          setCurrentLaptop(data.laptop);

          // Add to user history if user is authenticated
          if (user) {
            try {
              await fetch("/api/history", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: user.id,
                  laptopId: productId,
                }),
              });
            } catch (historyError) {
              console.warn("Failed to add laptop to history:", historyError);
            }
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchLaptopDetails();
  }, [productId, user, setCurrentLaptop]);

  // Cleanup current laptop context when component unmounts
  useEffect(() => {
    return () => {
      setCurrentLaptop(null);
    };
  }, [setCurrentLaptop]);

  const handleExternalLink = (link: string) => {
    window.open(link, "_blank");
  };

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
    setIsAutoSliding(false); // Pause auto-slide when user manually changes image
  };
  const toggleAutoSlide = () => {
    setIsAutoSliding(!isAutoSliding);
  };
  const getDisplayPrice = () => {
    if (!laptop?.sites || laptop.sites.length === 0) {
      return laptop?.allTimeLowPrice || null;
    }

    const prices = laptop.sites
      .map((site) => site.price)
      .filter((price) => price && price > 0);
    return prices.length > 0
      ? Math.min(...prices)
      : laptop?.allTimeLowPrice || null;
  };

  // Compare handlers
  const handleAddToCompare = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!laptop) return;
    
    const laptopData = {
      _id: laptop._id,
      brand: laptop.brand,
      series: laptop.series,
      specs: {
        head: laptop.specs.head,
        details: {
          imageLinks: laptop.specs?.details?.imageLinks || []
        }
      },
      allTimeLowPrice: laptop.allTimeLowPrice    };
    
    const success = addToCompare(laptopData);
    if (!success) {
      console.warn("Failed to add laptop to compare");
    }
  };

  const handleRemoveFromCompare = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!laptop) return;
    removeFromCompare(laptop._id);
  };

  const formatProcessor = () => {
    if (!laptop?.specs?.processor) return "";
    const { name, gen, variant } = laptop.specs.processor;
    let processorText = "";

    if (name) processorText += name;
    if (gen) processorText += ` ${gen}th Gen`;
    if (variant) processorText += ` ${variant}`;

    return processorText.trim();
  };

  const formatRAM = () => {
    if (!laptop?.specs?.ram) return "";
    const { size, type } = laptop.specs.ram;
    let ramText = "";

    if (size) ramText += `${size}GB`;
    if (type) ramText += ` ${type}`;

    return ramText.trim();
  };
  const formatStorageDisplay = () => {
    return formatStorage(laptop?.specs?.storage);
  };

  if (loading) {
    return (
      <div className="laptop-detail-loading">
        <div className="spinner"></div>
        <p>Loading laptop details...</p>
      </div>
    );
  }

  if (error || !laptop) {
    return (
      <div className="laptop-detail-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error || "Laptop not found"}</p>
        <button onClick={() => navigate("/")} className="back-button">
          Go Back to Home
        </button>
      </div>
    );
  }
  const images = laptop.specs?.details?.imageLinks || [];
  const currentImage = images[currentImageIndex] || "/placeholder-laptop.png";
  const displayPrice = getDisplayPrice();

  return (
    <div className="laptop-detail">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>

      <div className="laptop-detail-container">
        {/* Image Carousel Section */}
        <div className="laptop-images">
          <div className="main-image-container">
            <div className="main-image">
              <img src={currentImage} alt={laptop.specs.head} />
              {images.length > 1 && (
                <div className="image-controls">
                  <button
                    className={`auto-slide-btn ${
                      isAutoSliding ? "active" : ""
                    }`}
                    onClick={toggleAutoSlide}
                    title={isAutoSliding ? "Pause slideshow" : "Play slideshow"}
                  >
                    {isAutoSliding ? "⏸️" : "▶️"}
                  </button>
                  <span className="image-counter">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="image-thumbnails">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${laptop.specs.head} view ${index + 1}`}
                  className={`thumbnail ${
                    index === currentImageIndex ? "active" : ""
                  }`}
                  onClick={() => handleImageChange(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Laptop Information Section */}
        <div className="laptop-info">
          {" "}
          {/* Header with Name */}
          <div className="laptop-header">
            <div className="header-title-section">
              <h1>{laptop.specs.head}</h1>
              {laptop.brand && (
                <span className="brand-tag">{laptop.brand.toUpperCase()}</span>
              )}
            </div>            <div className="header-actions">
              <FavoriteButton
                laptopId={productId!}
                size="large"
                className="favorite-btn-detail"
              />
              {/* Compare Button */}
              <div className="compare-button-container">
                {isInCompare(productId!) ? (
                  <button
                    onClick={handleRemoveFromCompare}
                    className="compare-button compare-button-remove"
                  >
                    <span>✓</span>
                    <span>In Compare</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCompare}
                    disabled={!canAddMore}
                    className={`compare-button ${
                      canAddMore ? "compare-button-add" : "compare-button-disabled"
                    }`}
                  >
                    <span>⚖️</span>
                    <span>{canAddMore ? "Add to Compare" : "Compare Full"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>{" "}
          {/* Comparison Box */}
          <div className="comparison-box">
            <h3>
              <div className="comparison-icon title-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
              Key Specifications
            </h3>
            <div className="comparison-grid">
              {formatProcessor() && (
                <div className="comparison-item">
                  <div className="comparison-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2h3a1 1 0 011 1v4h2a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2h-4v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 011-1h2V8a1 1 0 011-1h3z" />
                    </svg>
                  </div>
                  <div className="comparison-content">
                    <p className="comparison-label">Processor</p>
                    <p className="comparison-value">{formatProcessor()}</p>
                  </div>
                </div>
              )}
              {formatRAM() && (
                <div className="comparison-item">
                  <div className="comparison-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h12V4H6zm2 2h8v2H8V6zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" />
                    </svg>
                  </div>
                  <div className="comparison-content">
                    <p className="comparison-label">Memory</p>
                    <p className="comparison-value">{formatRAM()}</p>
                  </div>
                </div>
              )}              {formatStorageDisplay() && (
                <div className="comparison-item">
                  <div className="comparison-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <div className="comparison-content">
                    <p className="comparison-label">Storage</p>
                    <p className="comparison-value">{formatStorageDisplay()}</p>
                  </div>
                </div>
              )}
              {laptop.specs.displayInch && (
                <div className="comparison-item">
                  <div className="comparison-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 3H3a1 1 0 00-1 1v12a1 1 0 001 1h7l-2 3v1h8v-1l-2-3h7a1 1 0 001-1V4a1 1 0 00-1-1zM20 15H4V5h16v10z" />
                    </svg>
                  </div>
                  <div className="comparison-content">
                    <p className="comparison-label">Display</p>
                    <p className="comparison-value">
                      {laptop.specs.displayInch}" Screen
                    </p>
                  </div>
                </div>
              )}
              {laptop.specs.gpu && (
                <div className="comparison-item">
                  <div className="comparison-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                    </svg>
                  </div>
                  <div className="comparison-content">
                    <p className="comparison-label">Graphics</p>
                    <p className="comparison-value">{laptop.specs.gpu}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Technical Specifications */}
          <div className="technical-specs">
            <h3>📋 Detailed Specifications</h3>
            <div className="specs-grid">
              {laptop.specs.head && (
                <div className="spec-item">
                  <span className="spec-label">Model Name</span>
                  <span className="spec-value">{laptop.specs.head}</span>
                </div>
              )}
              {laptop.brand && (
                <div className="spec-item">
                  <span className="spec-label">Brand</span>
                  <span className="spec-value">{laptop.brand}</span>
                </div>
              )}
              {laptop.series && (
                <div className="spec-item">
                  <span className="spec-label">Series</span>
                  <span className="spec-value">{laptop.series}</span>
                </div>
              )}
              {formatProcessor() && (
                <div className="spec-item">
                  <span className="spec-label">Processor</span>
                  <span className="spec-value">{formatProcessor()}</span>
                </div>
              )}
              {formatRAM() && (
                <div className="spec-item">
                  <span className="spec-label">Memory (RAM)</span>
                  <span className="spec-value">{formatRAM()}</span>
                </div>
              )}              {formatStorageDisplay() && (
                <div className="spec-item">
                  <span className="spec-label">Storage</span>
                  <span className="spec-value">{formatStorageDisplay()}</span>
                </div>
              )}
              {laptop.specs.displayInch && (
                <div className="spec-item">
                  <span className="spec-label">Screen Size</span>
                  <span className="spec-value">
                    {laptop.specs.displayInch} inches
                  </span>
                </div>
              )}
              {laptop.specs.gpu && (
                <div className="spec-item">
                  <span className="spec-label">Graphics Card</span>
                  <span className="spec-value">{laptop.specs.gpu}</span>
                </div>
              )}
              {laptop.specs.gpuVersion && (
                <div className="spec-item">
                  <span className="spec-label">GPU Version</span>
                  <span className="spec-value">{laptop.specs.gpuVersion}</span>
                </div>
              )}
              {laptop.specs.touch && (
                <div className="spec-item">
                  <span className="spec-label">Touchscreen</span>
                  <span className="spec-value">Yes</span>
                </div>
              )}
            </div>
          </div>
          {/* Purchase Options at Bottom */}
          {laptop.sites && laptop.sites.length > 0 && (
            <div className="purchase-section">
              <h3>🛒 Where to Buy</h3>
              <div className="site-options">
                {laptop.sites.map((site, index) => (
                  <div key={index} className="site-card">
                    <div className="site-header">
                      <div className="site-info">
                        <span className="site-name">
                          {site.source === "amazon"
                            ? "📦 Amazon"
                            : "🛍️ Flipkart"}
                        </span>
                        {site.rating && (
                          <div className="site-rating">
                            ⭐ {site.rating.toFixed(1)}
                            {site.ratingCount && site.ratingCount > 0 && (
                              <span className="rating-count">
                                {" "}
                                ({site.ratingCount.toLocaleString()})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="site-pricing">
                        {site.price && (
                          <span className="current-price">
                            ₹{site.price.toLocaleString("en-IN")}
                          </span>
                        )}
                        {site.basePrice && site.basePrice !== site.price && (
                          <span className="base-price">
                            ₹{site.basePrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                    {site.link && (
                      <button
                        onClick={() => handleExternalLink(site.link)}
                        className="buy-button"
                      >
                        Buy on{" "}
                        {site.source === "amazon" ? "Amazon" : "Flipkart"} →
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Best Price Display */}
              {displayPrice && (
                <div className="best-price-section">
                  <div className="best-price">
                    <span className="best-price-label">💰 Best Price:</span>
                    <span className="best-price-value">
                      ₹{displayPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {laptop.allTimeLowPrice &&
                    laptop.allTimeLowPrice !== displayPrice && (
                      <div className="all-time-low">
                        <span className="all-time-low-label">
                          🏆 All-time Low:
                        </span>
                        <span className="all-time-low-value">
                          ₹{laptop.allTimeLowPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaptopDetail;
