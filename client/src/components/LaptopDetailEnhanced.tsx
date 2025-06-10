import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTechAssistant } from "../contexts/TechAssistantContext";
import { useCompare } from "../hooks/useCompare";
import { FavoriteButton } from "./FavoriteButton/FavoriteButton";
import { formatStorage } from "../utils/storageUtils";
import { 
  formatBrand, 
  formatProcessorSpec, 
  formatRAMSpec, 
  formatGPU,
  formatModel
} from "../utils/textUtils";
import { isValidPrice } from "../utils";
import { createApiUrl } from "../utils/api";
import Comments from "./Comments/Comments";
import { Header } from "./index";
import "./LaptopDetailEnhanced.css";

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
    ratingCount?: string | number;
    basePrice?: number;
    details?: {
      imageLinks?: string[];
      Features?: string[];
      Brand?: string;
      Manufacturer?: string;
      Series?: string;
      Colour?: string;
      FormFactor?: string;
      ItemHeight?: string;
      ItemWidth?: string;
      StandingScreenDisplaySize?: string;
      ScreenResolution?: string;
      Resolution?: string;
      ProductDimensions?: string;
      Batteries?: string;
      ItemModelNumber?: string;
      ProcessorBrand?: string;
      ProcessorType?: string;
      ProcessorSpeed?: string;
      ProcessorCount?: string;
      RAMSize?: string;
      MemoryTechnology?: string;
      ComputerMemoryType?: string;
      MaximumMemorySupported?: string;
      HardDriveSize?: string;
      HardDiskDescription?: string;
      HardDriveInterface?: string;
      AudioDetails?: string;
      GraphicsCoprocessor?: string;
      GraphicsChipsetBrand?: string;
      GraphicsCardDescription?: string;
      GraphicsRAMType?: string;
      GraphicsCardInterface?: string;
      ConnectivityType?: string;
      WirelessType?: string;
      NumberOfHDMIPorts?: string;
      OperatingSystem?: string;
      AreBatteriesIncluded?: string;
      LithiumBatteryEnergyContent?: string;
      NumberOfLithiumIonCells?: string;
      IncludedComponents?: string;
      CountryOfOrigin?: string;
      ItemWeight?: string;
      ASIN?: string;
      CustomerReviews?: string;
      BestSellersRank?: string;
      DateFirstAvailable?: string;
      Packer?: string;
      Importer?: string;
      ItemDimensionsLxWxH?: string;
      NetQuantity?: string;
      GenericName?: string;
      ProductName?: string;
      [key: string]: string | string[] | undefined;
    };
  };
  sites: Array<{
    source: "amazon" | "flipkart";
    price: number;
    link: string;
    rating: number;
    ratingCount: number | string;
    basePrice?: number;
  }>;
  allTimeLowPrice: number;
}

const LaptopDetailEnhanced: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentLaptop } = useTechAssistant();
  const { addToCompare, removeFromCompare, canAddMore, isInCompare } = useCompare();
  const [laptop, setLaptop] = useState<LaptopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  useEffect(() => {
    const images = laptop?.specs?.details?.imageLinks || [];
    if (!isAutoSliding || images.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoSliding, laptop?.specs?.details?.imageLinks]);

  useEffect(() => {
    const fetchLaptopDetails = async () => {
      if (!productId) {
        setError("Product ID not found");
        setLoading(false);
        return;
      }      try {
        const response = await fetch(createApiUrl(`/api/laptop/${productId}`));
        if (!response.ok) {
          throw new Error("Failed to fetch laptop details");
        }
        const data = await response.json();
        if (data.success && data.laptop) {
          setLaptop(data.laptop);
          // Set current laptop for TechAssistant context
          setCurrentLaptop(data.laptop);          // Add to user history if user is authenticated
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
    setIsAutoSliding(false);
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
  };
  const formatProcessor = () => {
    return formatProcessorSpec(laptop?.specs?.processor);
  };

  const formatRAM = () => {
    return formatRAMSpec(laptop?.specs?.ram);
  };
  const formatStorageDisplay = () => {
    return formatStorage(laptop?.specs?.storage);
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
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

  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (!originalPrice || !currentPrice || originalPrice <= currentPrice)
      return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="star filled">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="star half">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="star empty">
            ☆
          </span>
        );
      }
    }
    return stars;
  };
  const getKeySpecs = () => {
    const details = laptop?.specs?.details || {};

    const specs = [
      { label: "Processor", value: formatProcessor() },
      { label: "RAM", value: formatRAM() },
      { label: "Storage", value: formatStorageDisplay() },
      {
        label: "Display",
        value: laptop?.specs?.displayInch ? `${laptop.specs.displayInch}"` : "",
      },      {
        label: "GPU",
        value: laptop?.specs?.gpu ? formatGPU(laptop.specs.gpu) : "",
      },
      {
        label: "Operating System",
        value: details.OperatingSystem || details["Operating System"] || "",
      },      {
        label: "Brand",
        value: laptop?.brand || details.Brand || details.Manufacturer ? 
               formatBrand(laptop?.brand || details.Brand || details.Manufacturer || "") : "",
      },
      { label: "Model", value: laptop?.specs?.head ? formatModel(laptop.specs.head) : "" },
    ];
    // Filter out empty values and ensure we have at least some specs
    const filteredSpecs = specs.filter(
      (spec) =>
        spec.value && typeof spec.value === "string" && spec.value.trim() !== ""
    );

    // If no specs found, return some fallback information
    if (filteredSpecs.length === 0) {      const fallback = [
        { label: "Brand", value: laptop?.brand || "Not specified" },
        { label: "Model", value: laptop?.specs?.head ? formatModel(laptop.specs.head) : "Not specified" },
        { label: "Processor", value: "Information not available" },
        { label: "RAM", value: "Information not available" },
        { label: "Storage", value: "Information not available" },
      ];
      return fallback;
    }

    return filteredSpecs;
  };

  const getAllSpecs = () => {
    const details = laptop?.specs?.details || {};
    const specsToShow = showAllSpecs
      ? Object.entries(details)
      : Object.entries(details).slice(0, 15);

    return specsToShow
      .filter(
        ([key, value]) =>
          key !== "imageLinks" &&
          key !== "Features" &&
          value &&
          value !== "N/A" &&
          value !== "" &&
          typeof value === "string"
      )
      .map(([key, value]) => ({
        label: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()),
        value: String(value),
      }));
  };

  const hasValidRatings = () => {
    return laptop?.sites?.some((site) => site.rating > 0 && site.ratingCount);
  };

  if (loading) {
    return (
      <div className="laptop-detail-enhanced">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading laptop details...</p>
        </div>
      </div>
    );
  }

  if (error || !laptop) {
    return (
      <div className="laptop-detail-enhanced">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error || "Laptop not found"}</p>
          <button onClick={() => navigate("/")} className="back-home-btn">
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  const images = laptop.specs?.details?.imageLinks || [];
  const currentImage = images[currentImageIndex] || "/placeholder-laptop.png";
  const displayPrice = getDisplayPrice();
  return (
    <>
      <Header />
      <div className="laptop-detail-enhanced">
        {/* Header */}
        <div className="detail-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>        <div className="breadcrumb">
            <span 
              className="breadcrumb-link"
              onClick={() => navigate('/')}
            >
              Home
            </span> 
            <span>/</span> 
            <span 
              className="breadcrumb-link"
              onClick={() => navigate('/search')}
            >
              Laptops
            </span>          <span>/</span>
            <span>{formatBrand(laptop.brand)}</span>
          </div>
        </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Image Gallery */}
        <div className="image-gallery">
          <div className="main-image-container">
            <img
              src={currentImage}
              alt={laptop.specs.head}
              className="main-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-laptop.png";
              }}
            />

            {images.length > 1 && (
              <div className="image-controls">
                <button
                  className={`autoplay-btn ${isAutoSliding ? "active" : ""}`}
                  onClick={toggleAutoSlide}
                  title={isAutoSliding ? "Pause slideshow" : "Play slideshow"}
                >
                  {isAutoSliding ? "⏸️" : "▶️"}
                </button>

                <button
                  className="nav-btn prev"
                  onClick={() =>
                    handleImageChange(
                      currentImageIndex > 0
                        ? currentImageIndex - 1
                        : images.length - 1
                    )
                  }
                >
                  ‹
                </button>

                <button
                  className="nav-btn next"
                  onClick={() =>
                    handleImageChange(
                      currentImageIndex < images.length - 1
                        ? currentImageIndex + 1
                        : 0
                    )
                  }
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="thumbnail-gallery">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`View ${index + 1}`}
                  className={`thumbnail ${
                    index === currentImageIndex ? "active" : ""
                  }`}
                  onClick={() => handleImageChange(index)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder-laptop.png";
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="product-info">
          {" "}
          <div className="product-header">
            <div className="header-top">
              <div className="title-section">
                <div className="brand-badge">{formatBrand(laptop.brand)}</div>
                <h1 className="product-title">{laptop.specs.head}</h1>
              </div>              <div className="header-actions">
                <FavoriteButton
                  laptopId={productId!}
                  size="large"
                  className="favorite-btn-enhanced"
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

            {/* Rating - Only show if there are valid ratings */}
            {hasValidRatings() && (
              <div className="rating-section">
                {laptop.sites.map((site, index) =>
                  site.rating > 0 && site.ratingCount ? (
                    <div key={index} className="rating-item">
                      <img
                        src={`/icons/${site.source}.png`}
                        alt={site.source}
                        className="site-icon"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="rating-stars">
                        {renderStarRating(site.rating)}
                      </div>
                      <span className="rating-value">{site.rating}/5</span>
                      <span className="rating-count">
                        ({site.ratingCount} reviews)
                      </span>
                      <span className="rating-source">on {site.source}</span>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>          {/* Price Section */}
          <div className="price-section">
            {displayPrice ? (
              <div className="current-price">{formatPrice(displayPrice)}</div>
            ) : (
              <div className="current-price text-gray-400">Contact seller for pricing</div>
            )}            {laptop.sites && laptop.sites.length > 0 && (
              <div className="price-comparison">
                {laptop.sites
                  .filter((site) => isValidPrice(site.price))
                  .map((site, index) => (
                  <div key={index} className="site-price">
                    <div className="site-info">
                      <img
                        src={`/icons/${site.source}.png`}
                        alt={site.source}
                        className="site-icon"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="site-name">
                        {site.source.charAt(0).toUpperCase() +
                          site.source.slice(1)}
                      </span>
                    </div>
                    <div className="price-info">
                      <span className="site-current-price">
                        {formatPrice(site.price)}
                      </span>
                      {site.basePrice && site.basePrice > site.price && (
                        <>
                          <span className="site-original-price">
                            {formatPrice(site.basePrice)}
                          </span>
                          <span className="discount-badge">
                            {calculateDiscount(site.basePrice, site.price)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      className="buy-button"
                      onClick={() => handleExternalLink(site.link)}
                    >
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>{" "}
          {/* Key Specifications */}
          <div className="key-specs">
            <h3>🔧 Key Specifications</h3>
            <div className="specs-grid">
              {getKeySpecs().length > 0 ? (
                getKeySpecs().map((spec, index) => (
                  <div key={index} className="spec-item">
                    <span className="spec-label">{spec.label}</span>
                    <span className="spec-value">{spec.value}</span>
                  </div>
                ))
              ) : (
                <div className="spec-item">
                  <span className="spec-label">Loading</span>
                  <span className="spec-value">Please wait...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tabs-section">
        <div className="tab-headers">
          <button
            className={`tab-header ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab-header ${
              activeTab === "specifications" ? "active" : ""
            }`}
            onClick={() => setActiveTab("specifications")}
          >
            Detailed Specifications
          </button>{" "}
          {laptop.specs?.details?.Features &&
            laptop.specs.details.Features.length > 0 && (
              <button
                className={`tab-header ${
                  activeTab === "features" ? "active" : ""
                }`}
                onClick={() => setActiveTab("features")}
              >
                Features
              </button>
            )}
          <button
            className={`tab-header ${activeTab === "comments" ? "active" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            Comments
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "overview" && (
            <div className="overview-tab">
              <div className="overview-grid">
                <div className="overview-section">
                  <h4>Performance</h4>
                  <div className="overview-items">
                    {formatProcessor() && (
                      <div className="overview-item">
                        <strong>Processor:</strong> {formatProcessor()}
                      </div>
                    )}
                    {formatRAM() && (
                      <div className="overview-item">
                        <strong>Memory:</strong> {formatRAM()}
                      </div>
                    )}                    {laptop.specs?.gpu && (
                      <div className="overview-item">
                        <strong>Graphics:</strong>{" "}
                        {formatGPU(laptop.specs.gpu)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="overview-section">
                  <h4>Storage & Display</h4>
                  <div className="overview-items">                    {formatStorageDisplay() && (
                      <div className="overview-item">
                        <strong>Storage:</strong> {formatStorageDisplay()}
                      </div>
                    )}
                    {laptop.specs?.displayInch && (
                      <div className="overview-item">
                        <strong>Display:</strong> {laptop.specs.displayInch}"
                        {laptop.specs?.details?.ScreenResolution &&
                          ` (${laptop.specs.details.ScreenResolution})`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="overview-section">
                  <h4>General Info</h4>
                  <div className="overview-items">
                    {laptop.specs?.details?.OperatingSystem && (
                      <div className="overview-item">
                        <strong>OS:</strong>{" "}
                        {laptop.specs.details.OperatingSystem}
                      </div>
                    )}
                    {laptop.specs?.details?.ItemWeight && (
                      <div className="overview-item">
                        <strong>Weight:</strong>{" "}
                        {laptop.specs.details.ItemWeight}
                      </div>
                    )}
                    {laptop.specs?.details?.Colour && (
                      <div className="overview-item">
                        <strong>Color:</strong> {laptop.specs.details.Colour}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "specifications" && (
            <div className="specifications-tab">
              <div className="specs-table">
                {getAllSpecs().map((spec, index) => (
                  <div key={index} className="spec-row">
                    <div className="spec-name">{spec.label}</div>
                    <div className="spec-detail">{spec.value}</div>
                  </div>
                ))}
              </div>

              {!showAllSpecs &&
                Object.keys(laptop.specs?.details || {}).length > 15 && (
                  <button
                    className="show-more-btn"
                    onClick={() => setShowAllSpecs(true)}
                  >
                    Show All Specifications
                  </button>
                )}
            </div>
          )}{" "}
          {activeTab === "features" && laptop.specs?.details?.Features && (
            <div className="features-tab">
              <div className="features-list">
                {laptop.specs.details.Features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="feature-icon">✓</div>
                    <div className="feature-text">{feature}</div>
                  </div>
                ))}
              </div>
            </div>
          )}          {activeTab === "comments" && (
            <div className="comments-tab">
              <Comments laptopId={productId || ""} />
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default LaptopDetailEnhanced;
