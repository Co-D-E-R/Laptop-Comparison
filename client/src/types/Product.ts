export interface Product {
  productName: string;
  productLink: string;
  cleanProductLink?: string;
  productId: string;
  badge?: string;
  price?: string;
  basePrice?: string;
  rating?: string;
  ratingsNumber?: string;
  technicalDetails: {
    imageLinks?: string[];
    "Model Name"?: string;
    "Processor Name"?: string;
    RAM?: string;
    "Screen Size"?: string;
    "Processor Brand"?: string;
    "Storage Type"?: string;
    "SSD Capacity"?: string;
    "HDD Capacity"?: string;
    "EMMC Storage Capacity"?: string;
    Brand?: string;
    Manufacturer?: string;
    // Allow for additional fields that might be present
    [key: string]: string | string[] | undefined;
  };
  // For multi-site display
  sites?: {
    source: "amazon" | "flipkart";
    price?: string;
    link?: string;
    rating?: string;
    ratingCount?: string;
  }[];
}
