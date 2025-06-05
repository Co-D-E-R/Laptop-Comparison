import { createContext } from "react";
import type { CompareContextType } from "../types/compare";

export const CompareContext = createContext<CompareContextType | undefined>(
  undefined
);
