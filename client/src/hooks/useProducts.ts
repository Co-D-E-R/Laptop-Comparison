
import { useState, useEffect } from 'react';
import type { Product } from '../types/Product';
import { removeDuplicates, shuffle } from '../utils';

interface UseProductsReturn {
  carouselProducts: Product[];
  recommendedProducts: Product[];
  recentlyViewedProducts: Product[];
  dealProducts: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useProducts = (): UseProductsReturn => {
  const [carouselProducts, setCarouselProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/scrapedDataF.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }

      const uniqueProducts = removeDuplicates(data);
      const shuffledProducts = shuffle(uniqueProducts);

      // Split products into different sections
      setCarouselProducts(shuffledProducts.slice(0, 8));
      setRecommendedProducts(shuffledProducts.slice(8, 16));
      setRecentlyViewedProducts(shuffledProducts.slice(16, 22));
      setDealProducts(shuffledProducts.slice(22, 30));
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    carouselProducts,
    recommendedProducts,
    recentlyViewedProducts,
    dealProducts,
    loading,
    error,
    refetch: fetchProducts
  };
};
