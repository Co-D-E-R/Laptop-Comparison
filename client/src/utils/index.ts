import type { Product } from "../types/Product";

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Truncates text to a specified length and adds ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
};

/**
 * Handles product click navigation - navigates to internal laptop detail page
 */
export const handleProductClick = (product: Product, navigate: (path: string) => void) => {
  if (product.productId) {
    navigate(`/laptop/${product.productId}`);
  }
};

/**
 * Formats price display with proper fallback and percentage calculation
 */
export const formatPrice = (price?: string, basePrice?: string): string => {
  if (!price && !basePrice) return "Price not available";

  const currentPrice = price || basePrice;
  if (!currentPrice) return "Price not available";

  return currentPrice;
};

/**
 * Calculates discount percentage between base price and current price
 */
export const calculateDiscount = (
  price?: string,
  basePrice?: string
): string | null => {
  if (!price || !basePrice || price === basePrice) return null;

  // Extract numeric values from price strings
  const currentPriceNum = parseFloat(price.replace(/[₹,]/g, ""));
  const basePriceNum = parseFloat(basePrice.replace(/[₹,]/g, ""));

  if (
    isNaN(currentPriceNum) ||
    isNaN(basePriceNum) ||
    basePriceNum <= currentPriceNum
  ) {
    return null;
  }

  const discountPercent = Math.round(
    ((basePriceNum - currentPriceNum) / basePriceNum) * 100
  );
  return `${discountPercent}% OFF`;
};

/**
 * Removes duplicate products based on productId
 */
export const removeDuplicates = (products: Product[]): Product[] => {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.productId)) {
      return false;
    }
    seen.add(product.productId);
    return true;
  });
};

/**
 * Removes duplicate products using advanced deduplication logic
 * Combines productId, brand, and productName to catch more duplicates
 */
export const removeAdvancedDuplicates = (products: Product[]): Product[] => {
  const seen = new Set<string>();
  const seenTitles = new Set<string>();
  
  return products.filter((product) => {
    // Primary check: productId
    if (seen.has(product.productId)) {
      return false;
    }
    
    // Secondary check: normalized product name and brand combination
    const normalizedName = product.productName
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
    const brand = (product.technicalDetails?.Brand || product.technicalDetails?.Manufacturer || "")?.toLowerCase() || "";
    const titleKey = `${brand}|${normalizedName}`;
    
    if (normalizedName && seenTitles.has(titleKey)) {
      return false;
    }
    
    // Tertiary check: look for similar titles (60% similarity)
    const productWords = normalizedName?.split(/\s+/) || [];
    if (productWords.length > 2) {
      for (const existingTitle of seenTitles) {
        const existingWords = existingTitle.split("|")[1]?.split(/\s+/) || [];
        if (existingWords.length > 2) {
          const commonWords = productWords.filter(word => 
            existingWords.some(existingWord => 
              existingWord.includes(word) || word.includes(existingWord)
            )
          );
          
          // If 60% or more words are similar, consider it a duplicate
          if (commonWords.length / Math.max(productWords.length, existingWords.length) >= 0.6) {
            return false;
          }
        }
      }
    }
    
    seen.add(product.productId);
    if (normalizedName) {
      seenTitles.add(titleKey);
    }
    return true;
  });
};

/**
 * Gets the primary image for a product
 */
export const getPrimaryImage = (product: Product): string => {
  return product?.technicalDetails?.imageLinks?.[0] || "/placeholder-image.jpg";
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Returns email validation error message
 */
export const getEmailValidationError = (email: string): string | null => {
  if (!email) return "Email is required";
  if (!validateEmail(email)) return "Please enter a valid email address";
  return null;
};

/**
 * Validates if a price is valid (not N/A, 0, empty, or null)
 */
export const isValidPrice = (price: number | string | null | undefined): boolean => {
  if (price === null || price === undefined) return false;
  if (typeof price === 'string') {
    const trimmed = price.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'n/a' || trimmed === '0') return false;
    const numericPrice = parseFloat(trimmed.replace(/[₹,]/g, ''));
    return !isNaN(numericPrice) && numericPrice > 0;
  }
  if (typeof price === 'number') {
    return !isNaN(price) && price > 0;
  }
  return false;
};

interface LaptopLike {
  sites?: Array<{ price?: number | string }>;
  allTimeLowPrice?: number | string;
}

interface ProductLike {
  sites?: Array<{ price?: number | string }>;
  price?: number | string;
  basePrice?: number | string;
}

/**
 * Checks if a laptop has at least one valid price (from sites or allTimeLowPrice)
 */
export const hasValidPrice = (laptop: LaptopLike): boolean => {
  // Check if any site has a valid price
  if (laptop.sites && Array.isArray(laptop.sites)) {
    const hasValidSitePrice = laptop.sites.some((site) => isValidPrice(site.price));
    if (hasValidSitePrice) return true;
  }
  
  // Check allTimeLowPrice as fallback
  return isValidPrice(laptop.allTimeLowPrice);
};

/**
 * Filters out laptops that don't have valid prices
 */
export const filterLaptopsWithValidPrices = <T extends LaptopLike>(laptops: T[]): T[] => {
  return laptops.filter(hasValidPrice);
};

/**
 * Checks if a product has valid price information
 */
export const hasValidProductPrice = (product: ProductLike): boolean => {
  // Check product.sites array first
  if (product.sites && Array.isArray(product.sites)) {
    const hasValidSitePrice = product.sites.some((site) => isValidPrice(site.price));
    if (hasValidSitePrice) return true;
  }
  
  // Check product.price
  if (isValidPrice(product.price)) return true;
  
  // Check product.basePrice as fallback
  return isValidPrice(product.basePrice);
};

/**
 * Filters out products that don't have valid prices
 */
export const filterProductsWithValidPrices = <T extends ProductLike>(products: T[]): T[] => {
  return products.filter(hasValidProductPrice);
};
