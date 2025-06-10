import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTechAssistant } from "../contexts/TechAssistantContext";
import { useCompare } from "../hooks/useCompare";
import { FavoriteButton } from "./FavoriteButton/FavoriteButton";
import { formatStorage } from "../utils/storageUtils";
import { formatBrand, formatSeries } from "../utils/textUtils";
import { isValidPrice } from "../utils";
import { createApiUrl } from "../utils/api";
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
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  // Auto-slide functionality
  useEffect(() => {
    if (
      !isAutoSliding ||
      !laptop?.specs?.details?.imageLinks ||
      laptop.specs.details.imageLinks.length <= 1
    ) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) =>
          (prevIndex + 1) % (laptop.specs.details?.imageLinks?.length || 1)
      );
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
        const response = await fetch(createApiUrl(`/api/laptop/${productId}`));
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
              await fetch(createApiUrl("/api/history"), {
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
  };
  const toggleAutoSlide = () => {
    setIsAutoSliding(!isAutoSliding);
  };  const getDisplayPrice = () => {
    if (!laptop?.sites || laptop.sites.length === 0) {
      return isValidPrice(laptop?.allTimeLowPrice) ? laptop?.allTimeLowPrice : null;
    }

    const prices = laptop.sites
      .map((site) => site.price)
      .filter((price) => isValidPrice(price));

    return prices.length > 0
      ? Math.min(...prices)
      : isValidPrice(laptop?.allTimeLowPrice) ? laptop?.allTimeLowPrice : null;
  };const getDisplayRating = () => {
    if (!laptop?.sites || laptop.sites.length === 0) {
      return null;
    }

    const ratings = laptop.sites
      .map((site) => site.rating)
      .filter((rating) => rating && rating > 0);

    return ratings.length > 0 ? Math.max(...ratings) : null;
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
        <h2>Error</h2>
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
  const displayRating = getDisplayRating();

  return (
    <div className="laptop-detail">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>

      <div className="laptop-detail-container">
        {/* Image Carousel */}
        <div className="laptop-images">
          <div className="image-carousel">
            <div className="main-image">
              <img src={currentImage} alt={laptop.specs.head} />

              {/* Carousel Controls */}
              <div className="carousel-controls">
                <button
                  onClick={toggleAutoSlide}
                  className={`auto-slide-btn ${
                    isAutoSliding ? "playing" : "paused"
                  }`}
                  title={
                    isAutoSliding ? "Pause auto-slide" : "Start auto-slide"
                  }
                >
                  {isAutoSliding ? "⏸️" : "▶️"}
                </button>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        handleImageChange(
                          (currentImageIndex - 1 + images.length) %
                            images.length
                        )
                      }
                      className="nav-btn prev-btn"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        handleImageChange(
                          (currentImageIndex + 1) % images.length
                        )
                      }
                      className="nav-btn next-btn"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* Image Indicators */}
              {images.length > 1 && (
                <div className="image-indicators">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageChange(index)}
                      className={`indicator ${
                        index === currentImageIndex ? "active" : ""
                      }`}
                    />
                  ))}
                </div>
              )}
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
        </div>

        {/* Laptop Information */}
        <div className="laptop-info">
          {" "}
          {/* Header */}
          <div className="laptop-header">
            <div className="header-title-section">
              <h1>{laptop.specs.head}</h1>
              <div className="brand-series">
                {laptop.brand && <span className="brand">{formatBrand(laptop.brand)}</span>}                {laptop.series && (
                  <span className="series">{formatSeries(laptop.series)}</span>
                )}
              </div>
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
          </div>
          {/* Comparison Box */}
          <div className="comparison-box">
            <h3>🔍 Quick Comparison</h3>
            <div className="comparison-grid">
              {laptop.specs.processor?.name && (
                <div className="comparison-item">
                  <span className="label">Processor</span>
                  <span className="value">
                    {laptop.specs.processor.name}
                    {laptop.specs.processor.gen &&
                      ` ${laptop.specs.processor.gen}th Gen`}
                  </span>
                </div>
              )}

              {laptop.specs.ram?.size && (
                <div className="comparison-item">
                  <span className="label">RAM</span>
                  <span className="value">
                    {laptop.specs.ram.size}GB {laptop.specs.ram.type}
                  </span>
                </div>
              )}              {laptop.specs.storage?.size && (
                <div className="comparison-item">
                  <span className="label">Storage</span>
                  <span className="value">
                    {formatStorage(laptop.specs.storage)}
                  </span>
                </div>
              )}

              {laptop.specs.displayInch && (
                <div className="comparison-item">
                  <span className="label">Display</span>
                  <span className="value">{laptop.specs.displayInch}"</span>
                </div>
              )}

              {laptop.specs.gpu && (
                <div className="comparison-item">
                  <span className="label">Graphics</span>
                  <span className="value">{laptop.specs.gpu}</span>
                </div>
              )}
            </div>
          </div>
          {/* Technical Specifications */}
          <div className="technical-specs">
            <h3>📋 Detailed Specifications</h3>
            <div className="specs-grid">
              {laptop.specs.processor?.variant && (
                <div className="spec-item">
                  <span className="spec-label">Processor Variant</span>
                  <span className="spec-value">
                    {laptop.specs.processor.variant}
                  </span>
                </div>
              )}

              {laptop.specs.gpuVersion && (
                <div className="spec-item">
                  <span className="spec-label">GPU Version</span>
                  <span className="spec-value">{laptop.specs.gpuVersion}</span>
                </div>
              )}

              {laptop.specs.touch !== undefined && (
                <div className="spec-item">
                  <span className="spec-label">Touchscreen</span>
                  <span className="spec-value">
                    {laptop.specs.touch ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
          </div>          {/* Pricing and Purchase Options */}
          <div className="pricing-section">
            {displayPrice ? (
              <div className="price-display">
                <span className="current-price">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                {laptop.allTimeLowPrice &&
                  laptop.allTimeLowPrice !== displayPrice &&
                  isValidPrice(laptop.allTimeLowPrice) && (
                    <span className="all-time-low">
                      All-time low: ₹
                      {laptop.allTimeLowPrice.toLocaleString("en-IN")}
                    </span>
                  )}
              </div>
            ) : (
              <div className="price-display">
                <span className="current-price text-gray-400">
                  Contact seller for pricing
                </span>
              </div>
            )}

            {displayRating && (
              <div className="rating-display">
                <span className="rating">⭐ {displayRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          {/* Site Redirect Options */}
          <div className="purchase-options">
            <h3>🛒 Available On</h3>            {laptop.sites && laptop.sites.length > 0 ? (
              <div className="sites-grid">
                {laptop.sites
                  .filter((site) => isValidPrice(site.price))
                  .map((site, index) => (
                  <div key={index} className="site-card">
                    <div className="site-header">
                      <img
                        src={`/${site.source}-logo.png`}
                        alt={site.source}
                        className="site-logo"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                      <span className="site-name">
                        {site.source.toUpperCase()}
                      </span>
                    </div>

                    <div className="site-details">
                      {site.price && (
                        <div className="site-price">
                          ₹{site.price.toLocaleString("en-IN")}
                        </div>
                      )}

                      {site.rating && (
                        <div className="site-rating">
                          ⭐ {site.rating.toFixed(1)}
                          {site.ratingCount && ` (${site.ratingCount})`}
                        </div>
                      )}

                      {site.basePrice && site.basePrice !== site.price && (
                        <div className="site-base-price">
                          MRP: ₹{site.basePrice.toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>

                    {site.link && (
                      <button
                        onClick={() => handleExternalLink(site.link)}
                        className="site-btn"
                      >
                        View on {site.source}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-sites">No purchase options available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaptopDetail;
