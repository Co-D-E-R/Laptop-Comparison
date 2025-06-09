import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createApiUrl } from "../utils/api";

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

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
};

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [compareItems, setCompareItems] = useState<LaptopCompareItem[]>([]);
  const [comparedLaptops, setComparedLaptops] = useState<Laptop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache for full laptop data to avoid repeated API calls
  const [laptopCache, setLaptopCache] = useState<Map<string, Laptop>>(new Map());

  // Load from localStorage on mount
  useEffect(() => {
    const loadSavedItems = () => {
      try {
        const savedItems = localStorage.getItem('compareItems');
        const savedLaptops = localStorage.getItem('comparedLaptops');
        
        if (savedItems) {
          const items = JSON.parse(savedItems);
          console.log('Loading saved compare items from localStorage:', items);
          setCompareItems(items);
        }
        
        if (savedLaptops) {
          const laptops = JSON.parse(savedLaptops);
          console.log('Loading saved compared laptops from localStorage:', laptops);
          setComparedLaptops(laptops);
          
          // Populate cache with saved laptop data
          const newCache = new Map();
          laptops.forEach((laptop: Laptop) => {
            newCache.set(laptop._id, laptop);
          });
          setLaptopCache(newCache);
        }
      } catch (error) {
        console.error('Failed to load compare data from localStorage:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSavedItems();
  }, []);

  // Save to localStorage whenever compareItems changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('compareItems', JSON.stringify(compareItems));
      console.log('Saved compare items to localStorage:', compareItems);
    }
  }, [compareItems, isInitialized]);
  // Save to localStorage whenever comparedLaptops changes
  useEffect(() => {
    if (isInitialized) {
      if (comparedLaptops.length > 0) {
        localStorage.setItem('comparedLaptops', JSON.stringify(comparedLaptops));
        console.log('Saved compared laptops to localStorage:', comparedLaptops);
      } else {
        // Only remove if we're initialized and explicitly have 0 laptops
        localStorage.removeItem('comparedLaptops');
      }
    }
  }, [comparedLaptops, isInitialized]);
  // Fetch full laptop data using the /laptop/:id endpoint
  const fetchFullLaptopData = useCallback(async (laptopId: string): Promise<Laptop | null> => {
    // Check cache first
    if (laptopCache.has(laptopId)) {
      return laptopCache.get(laptopId)!;
    }

    try {
      const response = await fetch(createApiUrl(`/api/laptop/${laptopId}`));
      const data = await response.json();
      
      if (data.success && data.laptop) {
        const laptop = data.laptop as Laptop;
        // Update cache
        setLaptopCache(prev => new Map(prev).set(laptopId, laptop));
        return laptop;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch laptop data for ${laptopId}:`, error);
      return null;
    }
  }, [laptopCache]);
  // Load full data for all compare items
  const loadAllCompareData = useCallback(async () => {
    if (compareItems.length === 0) {
      setComparedLaptops([]);
      return;
    }

    setIsLoading(true);
    try {
      // If we have cached laptops from localStorage, use them first
      if (comparedLaptops.length === compareItems.length) {
        const allCached = compareItems.every(item => 
          comparedLaptops.some(laptop => laptop._id === item._id)
        );
        if (allCached) {
          setIsLoading(false);
          return; // No need to refetch
        }
      }

      const laptopPromises = compareItems.map(item => fetchFullLaptopData(item._id));
      const laptops = await Promise.all(laptopPromises);
      
      // Filter out null results and update state
      const validLaptops = laptops.filter((laptop): laptop is Laptop => laptop !== null);
      setComparedLaptops(validLaptops);
    } catch (error) {
      console.error('Failed to load compare data:', error);
      // Fallback: try to keep existing compared laptops if any
      if (comparedLaptops.length === 0) {
        setComparedLaptops([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [compareItems, fetchFullLaptopData, comparedLaptops]);

  // Load full data whenever compareItems changes
  useEffect(() => {
    loadAllCompareData();
  }, [loadAllCompareData]);

  const addToCompare = useCallback(
    (laptop: LaptopCompareItem): boolean => {
      if (compareItems.length >= 3) {
        return false; // Maximum 3 laptops for comparison
      }

      if (compareItems.some((item) => item._id === laptop._id)) {
        return false; // Already in comparison
      }

      setCompareItems((prev) => [...prev, laptop]);
      return true;
    },
    [compareItems]
  );

  const removeFromCompare = useCallback((laptopId: string) => {
    setCompareItems((prev) =>
      prev.filter((item) => item._id !== laptopId)
    );
    // Also remove from cache to free memory
    setLaptopCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(laptopId);
      return newCache;
    });
  }, []);
  const clearCompare = useCallback(() => {
    setCompareItems([]);
    setComparedLaptops([]);
    setLaptopCache(new Map());
    localStorage.removeItem('compareItems');
    localStorage.removeItem('comparedLaptops');
  }, []);

  const isInCompare = useCallback(
    (laptopId: string): boolean => {
      return compareItems.some((item) => item._id === laptopId);
    },
    [compareItems]
  );

  const canAddMore = compareItems.length < 3;

  return (
    <CompareContext.Provider
      value={{
        comparedLaptops,
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
        fetchFullLaptopData,
        isLoading,
      }}
    >      {children}
    </CompareContext.Provider>
  );
};
