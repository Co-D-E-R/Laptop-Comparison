export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface LaptopContextData {
  _id?: string;
  brand?: string;
  series?: string;
  specs?: {
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
    gpu?: string;
    details?: {
      [key: string]: any;
    };
  };
  sites?: Array<{
    source: "amazon" | "flipkart";
    price: number;
    link: string;
    rating: number;
    ratingCount: number | string;
    basePrice?: number;
  }>;
  allTimeLowPrice?: number;
}
