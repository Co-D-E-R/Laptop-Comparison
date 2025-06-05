import React, { useState, useCallback } from "react";
import { CompareContext } from "../contexts/CompareContext";
import type { Laptop } from "../types/compare";

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [comparedLaptops, setComparedLaptops] = useState<Laptop[]>([]);

  const addToCompare = useCallback(
    (laptop: Laptop): boolean => {
      if (comparedLaptops.length >= 3) {
        return false; // Maximum 3 laptops for comparison
      }

      if (comparedLaptops.some((item) => item._id === laptop._id)) {
        return false; // Already in comparison
      }

      setComparedLaptops((prev) => [...prev, laptop]);
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

  const canAddMore = comparedLaptops.length < 3;

  return (
    <CompareContext.Provider
      value={{
        comparedLaptops,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};
