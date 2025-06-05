export interface Laptop {
  _id: string;
  brand: string;
  series: string;
  specs: {
    head: string;
    brand: string;
    series: string;
    processor: {
      name: string;
      gen: string;
      variant: string;
    };
    ram: {
      size: string;
      type: string;
    };
    storage: {
      size: string;
      type: string;
    };
    details: {
      imageLinks: string[];
      // Common specification fields found in laptop data
      Manufacturer?: string;
      Series?: string;
      Colour?: string;
      "Form Factor"?: string;
      "Processor Brand"?: string;
      "Processor Type"?: string;
      "Processor Speed"?: string;
      "Processor Count"?: string;
      "RAM Size"?: string;
      "Memory Technology"?: string;
      "Computer Memory Type"?: string;
      "Maximum Memory Supported"?: string;
      "Hard Drive Size"?: string;
      "Hard Disk Description"?: string;
      "Hard Drive Interface"?: string;
      "Graphics Coprocessor"?: string;
      "Graphics Chipset Brand"?: string;
      "Graphics Card Description"?: string;
      "Operating System"?: string;
      "Connectivity Type"?: string;
      "Wireless Type"?: string;
      "Number of USB 2.0 Ports"?: string;
      "Number of USB 3.0 Ports"?: string;
      "Number of HDMI Ports"?: string;
      "Item Weight"?: string;
      "Product Dimensions"?: string;
      "Item model number"?: string;
      "Hardware Platform"?: string;
      "Number of Processors"?: string;
      "Flash Memory Size"?: string;
      "Graphics Card Ram Size"?: string;
      Voltage?: string;
      "Are Batteries Included"?: string;
      "Lithium Battery Energy Content"?: string;
      "Lithium Battery Weight"?: string;
      "Number of Lithium Ion Cells"?: string;
      "Number of Lithium Metal Cells"?: string;
      Features?: string[];
      "Graphics RAM Type"?: string | string[];
      "Screen Resolution"?: string | string[];
      Resolution?: string | string[];
      "Audio Details"?: string | string[];
      "Item Dimensions LxWxH"?: string | string[];
      "Item Height"?: string | string[];
      "Item Width"?: string | string[];
      Batteries?: string | string[];
      "Standing screen display size"?: string | string[];
      // Allow for additional fields that might be present
      [key: string]: string | string[] | undefined;
    };
    displayInch: number;
    gpu: string;
    basePrice: number;
    ratingCount: string;
  };
  sites: Array<{
    source: string;
    price: number;
    link: string;
    rating: number;
    ratingCount: string;
    basePrice: number;
  }>;
  allTimeLowPrice: number;
}

export interface CompareContextType {
  comparedLaptops: Laptop[];
  addToCompare: (laptop: Laptop) => boolean;
  removeFromCompare: (laptopId: string) => void;
  clearCompare: () => void;
  isInCompare: (laptopId: string) => boolean;
  canAddMore: boolean;
}
