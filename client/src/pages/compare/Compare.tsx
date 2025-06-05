import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components";
import { useCompare } from "../../hooks/useCompare";
import type { Laptop } from "../../types/compare";
import "./Compare.css";

interface ComparisonSpec {
  label: string;
  getValue: (laptop: Laptop) => string | number;
  type: "string" | "number" | "price" | "processor" | "rating" | "features";
  unit?: string;
  category:
    | "basic"
    | "performance"
    | "display"
    | "connectivity"
    | "physical"
    | "price"
    | "rating";
}

const Compare: React.FC = () => {
  const navigate = useNavigate();
  const { comparedLaptops, removeFromCompare, clearCompare } = useCompare();  // Helper function to handle array values from laptop specs
  const getDetailValue = (value: string | string[] | undefined): string => {
    if (!value) return "N/A";
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "N/A";
    }
    return value;
  };

  // Helper function to check if a value is considered "empty" or "N/A"
  const isEmptyValue = (value: string | number): boolean => {
    if (value === null || value === undefined) return true;
    if (value === "N/A" || value === "n/a" || value === "") return true;
    if (typeof value === "number" && (value === 0 || isNaN(value))) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    return false;
  };

  // Helper function to check if a specification should be hidden
  // Returns true if ALL laptops have N/A or empty values for this spec
  const shouldHideSpec = (spec: ComparisonSpec): boolean => {
    const values = comparedLaptops.map((laptop) => spec.getValue(laptop));
    return values.every((value) => isEmptyValue(value));
  };

  // Define comprehensive comparison specifications
  const comparisonSpecs: ComparisonSpec[] = [
    // Basic Information
    {
      label: "Brand",
      getValue: (laptop) => laptop.specs?.brand || laptop.brand || "N/A",
      type: "string",
      category: "basic",
    },
    {
      label: "Series",
      getValue: (laptop) => laptop.specs?.series || laptop.series || "N/A",
      type: "string",
      category: "basic",
    },
    {
      label: "Model",
      getValue: (laptop) =>
        laptop.specs?.details?.["Item model number"] || "N/A",
      type: "string",
      category: "basic",
    },
    {
      label: "Color",
      getValue: (laptop) => laptop.specs?.details?.Colour || "N/A",
      type: "string",
      category: "basic",
    },
    {
      label: "Manufacturer",
      getValue: (laptop) => laptop.specs?.details?.Manufacturer || "N/A",
      type: "string",
      category: "basic",
    },

    // Performance Specifications
    {
      label: "Processor",
      getValue: (laptop) => {
        const proc = laptop.specs?.processor;
        if (proc?.name && proc?.gen) {
          return `${proc.name} ${proc.gen}th Gen ${proc.variant || ""}`.trim();
        }
        return laptop.specs?.details?.["Processor Type"] || "N/A";
      },
      type: "processor",
      category: "performance",
    },
    {
      label: "Processor Brand",
      getValue: (laptop) => laptop.specs?.details?.["Processor Brand"] || "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Processor Speed",
      getValue: (laptop) => laptop.specs?.details?.["Processor Speed"] || "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Processor Count",
      getValue: (laptop) => laptop.specs?.details?.["Processor Count"] || "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "RAM Size",
      getValue: (laptop) => {
        const ram = laptop.specs?.ram?.size;
        if (ram) return parseInt(ram.toString());
        const ramFromDetails = laptop.specs?.details?.["RAM Size"];
        return ramFromDetails ? parseInt(ramFromDetails.toString()) : 0;
      },
      type: "number",
      unit: "GB",
      category: "performance",
    },
    {
      label: "Memory Technology",
      getValue: (laptop) =>
        laptop.specs?.ram?.type?.toUpperCase() ||
        laptop.specs?.details?.["Memory Technology"] ||
        "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Computer Memory Type",
      getValue: (laptop) =>
        laptop.specs?.details?.["Computer Memory Type"] || "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Maximum Memory Supported",
      getValue: (laptop) =>
        laptop.specs?.details?.["Maximum Memory Supported"] || "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Storage Size",
      getValue: (laptop) => {
        const storage = laptop.specs?.storage?.size;
        if (storage) return parseInt(storage.toString());
        const storageFromDetails = laptop.specs?.details?.["Hard Drive Size"];
        if (storageFromDetails) {
          const match = storageFromDetails.toString().match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }
        return 0;
      },
      type: "number",
      unit: "GB",
      category: "performance",
    },
    {
      label: "Storage Type",
      getValue: (laptop) =>
        laptop.specs?.storage?.type?.toUpperCase() ||
        laptop.specs?.details?.["Hard Disk Description"] ||
        "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Hard Drive Interface",
      getValue: (laptop) =>
        laptop.specs?.details?.["Hard Drive Interface"] || "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Graphics",
      getValue: (laptop) =>
        laptop.specs?.details?.["Graphics Coprocessor"] ||
        laptop.specs?.gpu ||
        "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Graphics Brand",
      getValue: (laptop) =>
        laptop.specs?.details?.["Graphics Chipset Brand"] || "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Graphics Card Description",
      getValue: (laptop) =>
        laptop.specs?.details?.["Graphics Card Description"] || "N/A",
      type: "string",
      category: "performance",
    },
    {
      label: "Graphics RAM Type",
      getValue: (laptop) =>
        getDetailValue(laptop.specs?.details?.["Graphics RAM Type"]),
      type: "string",
      category: "performance",
    }, // Display Specifications
    {
      label: "Display Size",
      getValue: (laptop) => {
        const display = laptop.specs?.displayInch;
        if (display) return display;
        const displayFromDetails =
          laptop.specs?.details?.["Standing screen display size"];
        if (displayFromDetails) {
          const displayString = Array.isArray(displayFromDetails)
            ? displayFromDetails[0]
            : displayFromDetails;
          if (displayString) {
            const match = displayString.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : 0;
          }
        }
        return 0;
      },
      type: "number",
      unit: "inches",
      category: "display",
    },
    {
      label: "Screen Resolution",
      getValue: (laptop) =>
        getDetailValue(
          laptop.specs?.details?.["Screen Resolution"] ||
            laptop.specs?.details?.Resolution
        ),
      type: "string",
      category: "display",
    },

    // Connectivity
    {
      label: "Operating System",
      getValue: (laptop) =>
        laptop.specs?.details?.["Operating System"] || "N/A",
      type: "string",
      category: "connectivity",
    },
    {
      label: "Connectivity Type",
      getValue: (laptop) =>
        laptop.specs?.details?.["Connectivity Type"] || "N/A",
      type: "string",
      category: "connectivity",
    },
    {
      label: "Wireless Type",
      getValue: (laptop) => laptop.specs?.details?.["Wireless Type"] || "N/A",
      type: "string",
      category: "connectivity",
    },
    {
      label: "HDMI Ports",
      getValue: (laptop) =>
        laptop.specs?.details?.["Number of HDMI Ports"] || "N/A",
      type: "string",
      category: "connectivity",
    },
    {
      label: "Audio Details",
      getValue: (laptop) =>
        getDetailValue(laptop.specs?.details?.["Audio Details"]),
      type: "string",
      category: "connectivity",
    },

    // Physical Specifications
    {
      label: "Weight",
      getValue: (laptop) => laptop.specs?.details?.["Item Weight"] || "N/A",
      type: "string",
      category: "physical",
    },
    {
      label: "Dimensions",
      getValue: (laptop) =>
        getDetailValue(
          laptop.specs?.details?.["Product Dimensions"] ||
            laptop.specs?.details?.["Item Dimensions LxWxH"]
        ),
      type: "string",
      category: "physical",
    },
    {
      label: "Form Factor",
      getValue: (laptop) => laptop.specs?.details?.["Form Factor"] || "N/A",
      type: "string",
      category: "physical",
    },
    {
      label: "Item Height",
      getValue: (laptop) =>
        getDetailValue(laptop.specs?.details?.["Item Height"]),
      type: "string",
      category: "physical",
    },
    {
      label: "Item Width",
      getValue: (laptop) =>
        getDetailValue(laptop.specs?.details?.["Item Width"]),
      type: "string",
      category: "physical",
    },
    {
      label: "Battery",
      getValue: (laptop) =>
        laptop.specs?.details?.["Lithium Battery Energy Content"] || "N/A",
      type: "string",
      category: "physical",
    },
    {
      label: "Battery Type",
      getValue: (laptop) => getDetailValue(laptop.specs?.details?.Batteries),
      type: "string",
      category: "physical",
    },
    {
      label: "Number of Lithium Ion Cells",
      getValue: (laptop) =>
        laptop.specs?.details?.["Number of Lithium Ion Cells"] || "N/A",
      type: "string",
      category: "physical",
    },

    // Pricing
    {
      label: "Current Best Price",
      getValue: (laptop) => {
        if (laptop.sites && laptop.sites.length > 0) {
          const prices = laptop.sites
            .map((site) => site.price)
            .filter((price) => price && price > 0);
          if (prices.length > 0) {
            return Math.min(...prices);
          }
        }
        return laptop.allTimeLowPrice || 0;
      },
      type: "price",
      category: "price",
    },
    {
      label: "Base Price (MRP)",
      getValue: (laptop) => laptop.specs?.basePrice || 0,
      type: "price",
      category: "price",
    },
    {
      label: "All Time Low Price",
      getValue: (laptop) => laptop.allTimeLowPrice || 0,
      type: "price",
      category: "price",
    },

    // Rating
    {
      label: "Amazon Rating",
      getValue: (laptop) => {
        const amazonSite = laptop.sites?.find(
          (site) => site.source === "amazon"
        );
        return amazonSite?.rating || 0;
      },
      type: "rating",
      category: "rating",
    },
    {
      label: "Amazon Reviews Count",
      getValue: (laptop) => {
        const amazonSite = laptop.sites?.find(
          (site) => site.source === "amazon"
        );
        return amazonSite?.ratingCount || "0";
      },
      type: "string",
      category: "rating",
    },
    {
      label: "Flipkart Rating",
      getValue: (laptop) => {
        const flipkartSite = laptop.sites?.find(
          (site) => site.source === "flipkart"
        );
        return flipkartSite?.rating || 0;
      },
      type: "rating",
      category: "rating",
    },
    {
      label: "Flipkart Reviews Count",
      getValue: (laptop) => {
        const flipkartSite = laptop.sites?.find(
          (site) => site.source === "flipkart"
        );
        return flipkartSite?.ratingCount || "0";
      },
      type: "string",
      category: "rating",
    },
  ];
  // Group specifications by category and filter out specs where all values are N/A
  const specCategories = {
    basic: comparisonSpecs.filter((spec) => spec.category === "basic" && !shouldHideSpec(spec)),
    performance: comparisonSpecs.filter(
      (spec) => spec.category === "performance" && !shouldHideSpec(spec)
    ),
    display: comparisonSpecs.filter((spec) => spec.category === "display" && !shouldHideSpec(spec)),
    connectivity: comparisonSpecs.filter(
      (spec) => spec.category === "connectivity" && !shouldHideSpec(spec)
    ),
    physical: comparisonSpecs.filter((spec) => spec.category === "physical" && !shouldHideSpec(spec)),
    price: comparisonSpecs.filter((spec) => spec.category === "price" && !shouldHideSpec(spec)),
    rating: comparisonSpecs.filter((spec) => spec.category === "rating" && !shouldHideSpec(spec)),
  };

  const categoryTitles = {
    basic: "Basic Information",
    performance: "Performance & Hardware",
    display: "Display",
    connectivity: "Connectivity & OS",
    physical: "Physical Specifications",
    price: "Pricing",
    rating: "Ratings & Reviews",
  };

  // Get color coding for comparison values
  const getComparisonColor = (
    spec: ComparisonSpec,
    value: string | number,
    allValues: (string | number)[]
  ): string => {
    if (spec.type === "string" || spec.type === "processor") {
      return "neutral";
    }

    if (spec.type === "rating") {
      const numericValues = allValues
        .map((v) => (typeof v === "string" ? parseFloat(v) : v))
        .filter((v) => !isNaN(v) && v > 0)
        .sort((a, b) => b - a); // Higher rating is better

      if (numericValues.length < 2) return "neutral";

      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue === 0) return "neutral";

      if (numValue === numericValues[0]) return "best";
      if (numValue === numericValues[1] && numericValues.length >= 2)
        return "second";
      return "worst";
    }

    const numericValues = allValues
      .map((v) => (typeof v === "string" ? parseFloat(v) : v))
      .filter((v) => !isNaN(v) && v > 0)
      .sort((a, b) => (spec.type === "price" ? a - b : b - a)); // For price, lower is better

    if (numericValues.length < 2) return "neutral";

    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return "neutral";

    if (numValue === numericValues[0]) return "best";
    if (numValue === numericValues[1] && numericValues.length >= 2)
      return "second";
    return "worst";
  };

  const formatValue = (
    spec: ComparisonSpec,
    value: string | number
  ): string => {
    if (spec.type === "price") {
      const numValue =
        typeof value === "number" ? value : parseFloat(value.toString());
      if (isNaN(numValue) || numValue === 0) return "N/A";
      return `₹${numValue.toLocaleString("en-IN")}`;
    }
    if (spec.type === "rating") {
      const numValue =
        typeof value === "number" ? value : parseFloat(value.toString());
      if (isNaN(numValue) || numValue === 0) return "N/A";
      return `${numValue}/5`;
    }
    if (spec.type === "number" && spec.unit) {
      const numValue =
        typeof value === "number" ? value : parseFloat(value.toString());
      if (isNaN(numValue) || numValue === 0) return "N/A";
      return `${numValue} ${spec.unit}`;
    }
    const strValue = value.toString();
    return strValue === "0" || strValue === "" ? "N/A" : strValue;
  };

  const isProcessorComparable = (proc1: string, proc2: string): boolean => {
    const intel = /intel|i[3579]/i;
    const amd = /amd|ryzen/i;

    const isIntel1 = intel.test(proc1);
    const isAmd1 = amd.test(proc1);
    const isIntel2 = intel.test(proc2);
    const isAmd2 = amd.test(proc2);

    return (isIntel1 && isIntel2) || (isAmd1 && isAmd2);
  };

  if (comparedLaptops.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1333] via-[#2d1b4d] to-[#1a2a4f] text-white">
        <Header />
        <div className="pt-24 px-6">
          <div className="container mx-auto text-center py-20">
            <div className="glass-card p-12 rounded-2xl border border-purple-500/30 max-w-2xl mx-auto">
              <div className="text-6xl mb-6">⚖️</div>
              <h1 className="text-4xl font-bold mb-4 gradient-text">
                No Laptops to Compare
              </h1>
              <p className="text-white/70 text-lg mb-8">
                Add at least 2 laptops to your comparison list to see them side
                by side
              </p>
              <button
                onClick={() => navigate("/search")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Browse Laptops
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] via-[#2d1b4d] to-[#1a2a4f] text-white">
      <Header />
      <div className="pt-24 px-6">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Laptop Comparison
            </h1>
            <p className="text-white/70 text-lg">
              Compare {comparedLaptops.length} laptop
              {comparedLaptops.length !== 1 ? "s" : ""} side by side
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => navigate("/search")}
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white px-6 py-2 rounded-lg border border-purple-500/30 transition-all duration-300"
              >
                ← Back to Search
              </button>
              <button
                onClick={clearCompare}
                className="bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 text-white px-6 py-2 rounded-lg border border-red-500/30 transition-all duration-300"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Laptop Cards Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {comparedLaptops.map((laptop) => (
              <div
                key={laptop._id}
                className="glass-card p-6 rounded-xl border border-purple-500/30"
              >
                <div className="relative">
                  <img
                    src={
                      laptop.specs?.details?.imageLinks?.[0] ||
                      "/placeholder-laptop.jpg"
                    }
                    alt={laptop.specs?.head}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <button
                    onClick={() => removeFromCompare(laptop._id)}
                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300"
                    title="Remove from comparison"
                  >
                    ✕
                  </button>
                </div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {laptop.specs?.head || `${laptop.brand} ${laptop.series}`}
                </h3>
                <div className="space-y-1 text-sm text-white/70">
                  <p>
                    <span className="text-white">Brand:</span> {laptop.brand}
                  </p>
                  <p>
                    <span className="text-white">Series:</span> {laptop.series}
                  </p>
                  <p>
                    <span className="text-white">Best Price:</span> ₹
                    {laptop.allTimeLowPrice?.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/laptop/${laptop._id}`)}
                    className="flex-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white px-4 py-2 rounded-lg border border-purple-500/30 transition-all duration-300 text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}

            {/* Add laptop card if less than 3 */}
            {comparedLaptops.length < 3 && (
              <div className="glass-card p-6 rounded-xl border border-purple-500/30 border-dashed flex flex-col items-center justify-center min-h-[300px]">
                <div className="text-6xl mb-4 text-white/30">+</div>
                <h3 className="text-xl font-semibold mb-2 text-white/70">
                  Add Another Laptop
                </h3>
                <p className="text-white/50 text-center mb-4">
                  Compare up to 3 laptops
                </p>
                <button
                  onClick={() => navigate("/search")}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  Browse Laptops
                </button>
              </div>
            )}
          </div>

          {/* Detailed Comparison */}
          <div className="space-y-6">
            {Object.entries(specCategories).map(
              ([category, specs]) =>
                specs.length > 0 && (
                  <div
                    key={category}
                    className="glass-card rounded-xl border border-purple-500/30 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-6 py-4 border-b border-purple-500/30">
                      <h2 className="text-xl font-semibold gradient-text">
                        {
                          categoryTitles[
                            category as keyof typeof categoryTitles
                          ]
                        }
                      </h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-purple-500/20">
                            <th className="text-left p-4 text-white/80 font-medium min-w-[200px]">
                              Specification
                            </th>
                            {comparedLaptops.map((laptop) => (
                              <th
                                key={laptop._id}
                                className="text-center p-4 text-white/80 font-medium min-w-[250px]"
                              >
                                {laptop.brand} {laptop.series}
                              </th>
                            ))}
                            {comparedLaptops.length < 3 && (
                              <th className="text-center p-4 text-white/40 font-medium min-w-[250px]">
                                Add Laptop
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {specs.map((spec) => {
                            const values = comparedLaptops.map((laptop) =>
                              spec.getValue(laptop)
                            );

                            return (
                              <tr
                                key={spec.label}
                                className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                              >
                                <td className="p-4 font-medium text-white/90">
                                  {spec.label}
                                </td>
                                {comparedLaptops.map((laptop, laptopIndex) => {
                                  const value = values[laptopIndex];
                                  let colorClass = "";

                                  if (spec.type === "processor") {
                                    const allComparable = values.every((v) =>
                                      values.every((v2) =>
                                        isProcessorComparable(
                                          v.toString(),
                                          v2.toString()
                                        )
                                      )
                                    );
                                    if (!allComparable) {
                                      colorClass = "text-yellow-400";
                                    }
                                  } else {
                                    const comparison = getComparisonColor(
                                      spec,
                                      value,
                                      values
                                    );
                                    if (comparison === "best")
                                      colorClass =
                                        "text-green-400 font-semibold";
                                    else if (comparison === "second")
                                      colorClass =
                                        "text-yellow-400 font-semibold";
                                    else if (comparison === "worst")
                                      colorClass = "text-red-400";
                                  }

                                  return (
                                    <td
                                      key={laptop._id}
                                      className={`p-4 text-center ${colorClass}`}
                                    >
                                      {formatValue(spec, value)}
                                      {spec.type === "processor" &&
                                        !values.every((v) =>
                                          values.every((v2) =>
                                            isProcessorComparable(
                                              v.toString(),
                                              v2.toString()
                                            )
                                          )
                                        ) && (
                                          <div className="text-xs text-yellow-400/70 mt-1">
                                            Different types
                                          </div>
                                        )}
                                    </td>
                                  );
                                })}
                                {comparedLaptops.length < 3 && (
                                  <td className="p-4 text-center text-white/30">
                                    -
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
            )}
          </div>

          {/* Features Section */}
          <div className="mt-8 space-y-6">
            {" "}
            {comparedLaptops.map((laptop) => {
              const details = laptop.specs?.details as {
                [key: string]: string | string[] | undefined;
              };
              const features = details?.["Features"] as string[] | undefined;
              if (features && Array.isArray(features) && features.length > 0) {
                return (
                  <div
                    key={laptop._id}
                    className="glass-card rounded-xl border border-purple-500/30 p-6"
                  >
                    <h3 className="text-xl font-semibold gradient-text mb-4">
                      {laptop.brand} {laptop.series} - Key Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {features.slice(0, 10).map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg"
                        >
                          <div className="text-green-400 mt-1">✓</div>
                          <p className="text-sm text-white/80">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Shopping Links */}
          <div className="mt-8 space-y-4">
            {comparedLaptops.map((laptop) => (
              <div
                key={laptop._id}
                className="glass-card rounded-xl border border-purple-500/30 p-6"
              >
                <h3 className="text-lg font-semibold mb-4 gradient-text">
                  {laptop.brand} {laptop.series} - Purchase Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {laptop.sites?.map((site) => (
                    <a
                      key={site.source}
                      href={site.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20 transition-all duration-300 group"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold capitalize">
                            {site.source}
                          </span>
                          {site.rating && (
                            <span className="text-yellow-400 text-sm">
                              ⭐ {site.rating}/5 ({site.ratingCount})
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-green-400">
                          ₹{site.price?.toLocaleString("en-IN")}
                        </div>
                        {site.basePrice && site.basePrice > site.price && (
                          <div className="text-sm text-white/60 line-through">
                            ₹{site.basePrice.toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                      <div className="text-purple-400 group-hover:text-white transition-colors">
                        →
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="glass-card p-6 rounded-xl border border-purple-500/30 mt-8">
            <h3 className="text-lg font-semibold mb-4 text-center gradient-text">
              Color Legend
            </h3>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span>Best Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Second Best</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>Lowest Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white/30 rounded"></div>
                <span>Not Comparable</span>
              </div>
            </div>
            <p className="text-center text-white/60 text-xs mt-4">
              * For pricing, lower values are better. For other specifications,
              higher values are generally better.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
