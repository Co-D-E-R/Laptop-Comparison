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
  };
}
