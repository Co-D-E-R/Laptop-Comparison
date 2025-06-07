import React, { createContext, useState, useCallback, useEffect } from "react";

export interface Laptop {
  _id: string;
  brand: string;
  series: string;
  specs: {
    head: string;
    brand?: string;
    series?: string;
    processor: {
      name: string;
      gen: string;
      variant: string;
    };
    ram: {
      size: number; // Fixed: should be number to match database schema
      type: string;
    };
    storage: {
      size: number; // Fixed: should be number to match database schema
      type: string;
    };
    details: {
      imageLinks: string[];
      [key: string]: any; // Allow for additional detail fields
    };
    displayInch: number;
    gpu: string;
    gpuVersion?: string;
    touch?: boolean;
    basePrice?: number;
    ratingCount?: string | number;
  };
  sites: Array<{
    source: string;
    price: number;
    link: string;
    rating: number;
    ratingCount: string | number;
    basePrice?: number;
  }>;
  allTimeLowPrice: number;
}

// Simplified version for initial storage (from search results)
interface LaptopCompareItem {
  _id: string;
  brand: string;
  series: string;
  specs?: {
    head?: string;
    details?: {
      imageLinks?: string[];
    };
  };
  allTimeLowPrice?: number;
}

interface CompareContextType {
  comparedLaptops: Laptop[];
  compareItems: LaptopCompareItem[]; // Simplified items before full data fetch
  addToCompare: (laptop: LaptopCompareItem) => boolean;
  removeFromCompare: (laptopId: string) => void;
  clearCompare: () => void;
  isInCompare: (laptopId: string) => boolean;
  canAddMore: boolean;
  fetchFullLaptopData: (laptopId: string) => Promise<Laptop | null>;
  isLoading: boolean;
}

export const CompareContext = createContext<CompareContextType | undefined>(
  undefined
);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [comparedLaptops, setComparedLaptops] = useState<Laptop[]>(() => {
    // Load from localStorage on initial mount
    const saved = localStorage.getItem("comparedLaptops");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Save to localStorage whenever comparedLaptops changes
  useEffect(() => {
    localStorage.setItem("comparedLaptops", JSON.stringify(comparedLaptops));
  }, [comparedLaptops]);  const addToCompare = useCallback(
    (laptop: LaptopCompareItem): boolean => {
      if (comparedLaptops.length >= 3) {
        return false; // Maximum 3 laptops for comparison
      }

      if (comparedLaptops.some((item) => item._id === laptop._id)) {
        return false; // Already in comparison
      }

      // Convert LaptopCompareItem to Laptop format for storage with default values
      const fullLaptop: Laptop = {
        _id: laptop._id,
        brand: laptop.brand,
        series: laptop.series,
        specs: {
          head: laptop.specs?.head || `${laptop.brand} ${laptop.series}`,
          processor: { name: "Unknown", gen: "Unknown", variant: "Unknown" },
          ram: { size: 0, type: "Unknown" },
          storage: { size: 0, type: "Unknown" },
          details: {
            ...laptop.specs?.details,
            imageLinks: laptop.specs?.details?.imageLinks || []
          },
          displayInch: 0,
          gpu: "Unknown",
          ratingCount: "0"
        },
        sites: [], // Initialize with empty sites array
        allTimeLowPrice: laptop.allTimeLowPrice || 0
      };

      setComparedLaptops((prev) => [...prev, fullLaptop]);
      return true;
    },
    [comparedLaptops]
  );

  const removeFromCompare = useCallback((laptopId: string) => {
    setComparedLaptops((prev) =>
      prev.filter((laptop) => laptop._id !== laptopId)
    );
  }, []);

  const clearCompare = useCallback(() => {
    setComparedLaptops([]);
  }, []);

  const isInCompare = useCallback(
    (laptopId: string): boolean => {
      return comparedLaptops.some((laptop) => laptop._id === laptopId);
    },
    [comparedLaptops]
  );
  const canAddMore = comparedLaptops.length < 3;  // Placeholder functions for missing properties
  const fetchFullLaptopData = useCallback(async (laptopId: string): Promise<Laptop | null> => {
    // TODO: Implement actual data fetching for laptop with ID: ${laptopId}
    console.log(`Fetching data for laptop ${laptopId}`);
    return null;
  }, []);

  return (
    <CompareContext.Provider
      value={{
        comparedLaptops,
        compareItems: [], // Placeholder for now
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
        fetchFullLaptopData,
        isLoading: false, // Placeholder for now
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};
