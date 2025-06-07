import { useState, useEffect, useCallback } from "react";
import type { Product } from "../types/Product";

interface LaptopSite {
  source: "amazon" | "flipkart";
  price: number;
  link: string;
  rating?: number;
  ratingCount?: number;
  basePrice?: number;
}

interface LaptopSpecs {
  head?: string;
  processor?: {
    name?: string;
    gen?: string;
    variant?: string;
  };
  ram?: {
    size?: number;
    type?: string;
  };
  storage?: {
    size?: number;
    type?: string;
  };
  displayInch?: number;
  basePrice?: number;
  details?: {
    imageLinks?: string[];
    images?: string;
    [key: string]: unknown;
  };
}

interface FavoriteLaptop {
  _id: string;
  brand?: string;
  specs?: LaptopSpecs;
  sites?: LaptopSite[];
}

interface UseFavoritesReturn {
  favoriteProducts: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  removeFavorite: (laptopId: string) => Promise<boolean>;
  addFavorite: (laptopId: string) => Promise<boolean>;
  isFavorite: (laptopId: string) => boolean;
}

export const useFavorites = (userId?: string): UseFavoritesReturn => {
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavoriteProducts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/favorites/${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.favorites)) {
        throw new Error("Invalid data format received from server");
      }

      // Transform favorites data to match Product interface
      const transformedFavorites = data.favorites.map(
        (laptop: FavoriteLaptop) => {
          // Extract prices from sites array
          const amazonSite = laptop.sites?.find(
            (site: LaptopSite) => site.source === "amazon"
          );
          const flipkartSite = laptop.sites?.find(
            (site: LaptopSite) => site.source === "flipkart"
          );

          // Get the lowest price for display
          const prices =
            laptop.sites
              ?.map((site: LaptopSite) => site.price)
              .filter(Boolean) || [];
          const lowestPrice =
            prices.length > 0
              ? Math.min(...prices)
              : laptop.specs?.basePrice || null;

          // Extract images from specs.details
          const images =
            laptop.specs?.details?.imageLinks ||
            (laptop.specs?.details?.images
              ? [laptop.specs.details.images]
              : []) ||
            [];

          return {
            productId: laptop._id,
            productName: laptop.specs?.head || "Unknown Model",
            productLink: "#",
            price: lowestPrice
              ? `₹${lowestPrice.toLocaleString()}`
              : "Price not available",
            basePrice: laptop.specs?.basePrice
              ? `₹${laptop.specs.basePrice.toLocaleString()}`
              : undefined,
            rating:
              amazonSite?.rating?.toString() ||
              flipkartSite?.rating?.toString() ||
              "4.0",
            technicalDetails: {
              imageLinks: images,
              "Model Name": laptop.specs?.head || "Unknown Model",
              "Processor Name":
                laptop.specs?.processor?.name && laptop.specs?.processor?.gen
                  ? `${laptop.specs.processor.name} ${laptop.specs.processor.gen}th Gen`
                  : laptop.specs?.processor?.name || "Not specified",
              RAM: laptop.specs?.ram?.size
                ? `${laptop.specs.ram.size}GB ${laptop.specs.ram.type || "RAM"}`
                : "Not specified",
              "Storage Type":
                laptop.specs?.storage?.size && laptop.specs?.storage?.type
                  ? `${laptop.specs.storage.size}GB ${laptop.specs.storage.type}`
                  : "Not specified",
              "Screen Size": laptop.specs?.displayInch
                ? `${laptop.specs.displayInch}"`
                : "Not specified",
            },
            sites: [
              ...(amazonSite
                ? [
                    {
                      source: "amazon" as const,
                      price: `₹${amazonSite.price.toLocaleString()}`,
                      link: amazonSite.link || "#",
                      rating: amazonSite.rating?.toString() || "4.0",
                      ratingCount: amazonSite.ratingCount?.toString() || "100",
                    },
                  ]
                : []),
              ...(flipkartSite
                ? [
                    {
                      source: "flipkart" as const,
                      price: `₹${flipkartSite.price.toLocaleString()}`,
                      link: flipkartSite.link || "#",
                      rating: flipkartSite.rating?.toString() || "4.0",
                      ratingCount:
                        flipkartSite.ratingCount?.toString() || "100",
                    },
                  ]
                : []),
            ],
          };
        }
      );

      setFavoriteProducts(transformedFavorites);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const removeFavorite = useCallback(
    async (laptopId: string): Promise<boolean> => {
      if (!userId) return false;      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/favorites`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId,
            laptopId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          // Remove item from local state
          setFavoriteProducts((prev) =>
            prev.filter((product) => product.productId !== laptopId)
          );
          return true;
        }

        return false;
      } catch (err) {
        console.error("Error removing favorite:", err);
        setError(
          err instanceof Error ? err.message : "Failed to remove favorite"
        );
        return false;
      }
    },
    [userId]
  );
  const addFavorite = useCallback(
    async (laptopId: string): Promise<boolean> => {
      if (!userId) return false;      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId,
            laptopId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          // Refetch favorites to update the local state
          await fetchFavorites();
          return true;
        }

        return false;
      } catch (err) {
        console.error("Error adding favorite:", err);
        setError(
          err instanceof Error ? err.message : "Failed to add to favorites"
        );
        return false;
      }
    },
    [userId, fetchFavorites]
  );

  const isFavorite = useCallback(
    (laptopId: string): boolean => {
      return favoriteProducts.some((product) => product.productId === laptopId);
    },
    [favoriteProducts]
  );

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favoriteProducts,
    loading,
    error,
    refetch: fetchFavorites,
    removeFavorite,
    addFavorite,
    isFavorite,
  };
};
