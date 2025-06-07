import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components';
import { useCompare } from '../../hooks/useCompare';
import type { Laptop } from '../../types/compare';
import './Compare.css';

interface ComparisonSpec {
  label: string;
  getValue: (laptop: Laptop) => string | number;
  type: 'string' | 'number' | 'price' | 'processor' | 'rating' | 'features';
  unit?: string;
  category: 'basic' | 'performance' | 'display' | 'connectivity' | 'physical' | 'price' | 'rating';
}

// Helper function to handle string or string array values
const getStringValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value || 'N/A';
};

const Compare: React.FC = () => {
  const navigate = useNavigate();
  const { comparedLaptops, removeFromCompare, clearCompare } = useCompare();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // Define comprehensive comparison specifications
  const comparisonSpecs: ComparisonSpec[] = [
    // Basic Information
    {
      label: 'Brand',
      getValue: (laptop) => laptop.specs?.brand || laptop.brand || 'N/A',
      type: 'string',
      category: 'basic'
    },
    {
      label: 'Series',
      getValue: (laptop) => laptop.specs?.series || laptop.series || 'N/A',
      type: 'string',
      category: 'basic'
    },
    {
      label: 'Model',
      getValue: (laptop) => laptop.specs?.details?.['Item model number'] || 'N/A',
      type: 'string',
      category: 'basic'
    },
    {
      label: 'Color',
      getValue: (laptop) => laptop.specs?.details?.Colour || 'N/A',
      type: 'string',
      category: 'basic'
    },
    {
      label: 'Manufacturer',
      getValue: (laptop) => laptop.specs?.details?.Manufacturer || 'N/A',
      type: 'string',
      category: 'basic'
    },

    // Performance Specifications
    {
      label: 'Processor',
      getValue: (laptop) => {
        const proc = laptop.specs?.processor;
        if (proc?.name && proc?.gen) {
          return `${proc.name} ${proc.gen}th Gen ${proc.variant || ''}`.trim();
        }
        return laptop.specs?.details?.['Processor Type'] || 'N/A';
      },
      type: 'processor',
      category: 'performance'
    },
    {
      label: 'Processor Brand',
      getValue: (laptop) => laptop.specs?.details?.['Processor Brand'] || 'N/A',
      type: 'string',
      category: 'performance'
    },
    {
      label: 'Processor Speed',
      getValue: (laptop) => laptop.specs?.details?.['Processor Speed'] || 'N/A',
      type: 'string',
      category: 'performance'
    },
    {
      label: 'RAM Size',
      getValue: (laptop) => {
        const ram = laptop.specs?.ram?.size;
        if (ram) return parseInt(ram.toString());
        const ramFromDetails = laptop.specs?.details?.['RAM Size'];
        return ramFromDetails ? parseInt(ramFromDetails.toString()) : 0;
      },
      type: 'number',
      unit: 'GB',
      category: 'performance'
    },
    {
      label: 'Memory Technology',
      getValue: (laptop) => laptop.specs?.ram?.type?.toUpperCase() || laptop.specs?.details?.['Memory Technology'] || 'N/A',
      type: 'string',
      category: 'performance'
    },
    {
      label: 'Storage Size',
      getValue: (laptop) => {
        const storage = laptop.specs?.storage?.size;
        if (storage) return parseInt(storage.toString());
        const storageFromDetails = laptop.specs?.details?.['Hard Drive Size'];
        return storageFromDetails ? parseInt(storageFromDetails.toString().replace('GB', '').trim()) : 0;
      },
      type: 'number',
      unit: 'GB',
      category: 'performance'
    },
    {
      label: 'Storage Type',
      getValue: (laptop) => laptop.specs?.storage?.type?.toUpperCase() || laptop.specs?.details?.['Hard Disk Description'] || 'N/A',
      type: 'string',
      category: 'performance'
    },
    {
      label: 'Graphics',
      getValue: (laptop) => laptop.specs?.details?.['Graphics Coprocessor'] || laptop.specs?.gpu || 'N/A',
      type: 'string',
      category: 'performance'
    },
    {
      label: 'Graphics Brand',
      getValue: (laptop) => laptop.specs?.details?.['Graphics Chipset Brand'] || 'N/A',
      type: 'string',
      category: 'performance'
    },

    // Display Specifications
    {
      label: 'Display Size',      getValue: (laptop) => {
        const display = laptop.specs?.displayInch;
        if (display) return display;
        const displayFromDetails = laptop.specs?.details?.['Standing screen display size'];
        if (displayFromDetails) {
          const displayString = getStringValue(displayFromDetails);
          const match = displayString.match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[1]) : 0;
        }
        return 0;
      },
      type: 'number',
      unit: 'inches',
      category: 'display'
    },    {
      label: 'Screen Resolution',
      getValue: (laptop) => getStringValue(laptop.specs?.details?.['Screen Resolution'] || laptop.specs?.details?.Resolution),
      type: 'string',
      category: 'display'
    },

    // Connectivity
    {
      label: 'Operating System',
      getValue: (laptop) => laptop.specs?.details?.['Operating System'] || 'N/A',
      type: 'string',
      category: 'connectivity'
    },
    {
      label: 'Connectivity Type',
      getValue: (laptop) => laptop.specs?.details?.['Connectivity Type'] || 'N/A',
      type: 'string',
      category: 'connectivity'
    },
    {
      label: 'Wireless Type',
      getValue: (laptop) => laptop.specs?.details?.['Wireless Type'] || 'N/A',
      type: 'string',
      category: 'connectivity'
    },
    {
      label: 'HDMI Ports',
      getValue: (laptop) => laptop.specs?.details?.['Number of HDMI Ports'] || 'N/A',
      type: 'string',
      category: 'connectivity'
    },

    // Physical Specifications
    {
      label: 'Weight',
      getValue: (laptop) => laptop.specs?.details?.['Item Weight'] || 'N/A',
      type: 'string',
      category: 'physical'
    },    {
      label: 'Dimensions',
      getValue: (laptop) => getStringValue(laptop.specs?.details?.['Product Dimensions'] || laptop.specs?.details?.['Item Dimensions LxWxH']),
      type: 'string',
      category: 'physical'
    },
    {
      label: 'Form Factor',
      getValue: (laptop) => laptop.specs?.details?.['Form Factor'] || 'N/A',
      type: 'string',
      category: 'physical'
    },
    {
      label: 'Battery',
      getValue: (laptop) => laptop.specs?.details?.['Lithium Battery Energy Content'] || 'N/A',
      type: 'string',
      category: 'physical'
    },

    // Pricing
    {
      label: 'Current Price',
      getValue: (laptop) => {
        if (laptop.sites && laptop.sites.length > 0) {
          const prices = laptop.sites
            .map(site => site.price)
            .filter(price => price && price > 0);
          if (prices.length > 0) {
            return Math.min(...prices);
          }
        }
        return laptop.allTimeLowPrice || 0;
      },
      type: 'price',
      category: 'price'
    },
    {
      label: 'Base Price',
      getValue: (laptop) => laptop.specs?.basePrice || 0,
      type: 'price',
      category: 'price'
    },
    {
      label: 'All Time Low',
      getValue: (laptop) => laptop.allTimeLowPrice || 0,
      type: 'price',
      category: 'price'
    },

    // Rating
    {
      label: 'Amazon Rating',
      getValue: (laptop) => {
        const amazonSite = laptop.sites?.find(site => site.source === 'amazon');
        return amazonSite?.rating || 0;
      },
      type: 'rating',
      category: 'rating'
    },
    {
      label: 'Amazon Reviews',
      getValue: (laptop) => {
        const amazonSite = laptop.sites?.find(site => site.source === 'amazon');
        return amazonSite?.ratingCount || '0';
      },
      type: 'string',
      category: 'rating'
    },
    {
      label: 'Flipkart Rating',
      getValue: (laptop) => {
        const flipkartSite = laptop.sites?.find(site => site.source === 'flipkart');
        return flipkartSite?.rating || 0;
      },
      type: 'rating',
      category: 'rating'
    },
    {
      label: 'Flipkart Reviews',
      getValue: (laptop) => {
        const flipkartSite = laptop.sites?.find(site => site.source === 'flipkart');
        return flipkartSite?.ratingCount || '0';
      },
      type: 'string',
      category: 'rating'
    }
  ];
  // Get color coding for comparison values
  const getComparisonColor = (spec: ComparisonSpec, value: string | number, allValues: (string | number)[]): string => {
    if (spec.type === 'string' || spec.type === 'processor') {
      return 'neutral';
    }

    if (spec.type === 'rating') {
      const numericValues = allValues
        .map(v => typeof v === 'string' ? parseFloat(v) : v)
        .filter(v => !isNaN(v) && v > 0)
        .sort((a, b) => b - a); // Higher rating is better

      if (numericValues.length < 2) return 'neutral';

      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue === 0) return 'neutral';

      if (numValue === numericValues[0]) return 'best';
      if (numValue === numericValues[1] && numericValues.length >= 2) return 'second';
      return 'worst';
    }

    const numericValues = allValues
      .map(v => typeof v === 'string' ? parseFloat(v) : v)
      .filter(v => !isNaN(v) && v > 0)
      .sort((a, b) => spec.type === 'price' ? a - b : b - a); // For price, lower is better

    if (numericValues.length < 2) return 'neutral';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return 'neutral';

    if (numValue === numericValues[0]) return 'best';
    if (numValue === numericValues[1] && numericValues.length >= 2) return 'second';
    return 'worst';
  };

  const formatValue = (spec: ComparisonSpec, value: string | number): string => {
    if (spec.type === 'price') {
      const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
      if (isNaN(numValue) || numValue === 0) return 'N/A';
      return `₹${numValue.toLocaleString('en-IN')}`;
    }
    if (spec.type === 'rating') {
      const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
      if (isNaN(numValue) || numValue === 0) return 'N/A';
      return `${numValue}/5`;
    }
    if (spec.type === 'number' && spec.unit) {
      const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
      if (isNaN(numValue) || numValue === 0) return 'N/A';
      return `${numValue} ${spec.unit}`;
    }
    const strValue = value.toString();
    return strValue === '0' || strValue === '' ? 'N/A' : strValue;
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
                Add at least 2 laptops to your comparison list to see them side by side
              </p>
              <button
                onClick={() => navigate('/search')}
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
              Compare {comparedLaptops.length} laptop{comparedLaptops.length !== 1 ? 's' : ''} side by side
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => navigate('/search')}
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

          {/* Comparison Table */}
          <div className="glass-card rounded-2xl border border-purple-500/30 overflow-hidden">
            <div className="compare-grid">
              {/* Header Row */}
              <div className="compare-header">
                <div className="spec-label-header">Specifications</div>                {comparedLaptops.map((laptop) => (
                  <div key={laptop._id} className="laptop-header">
                    <div className="laptop-image">
                      <img
                        src={laptop.specs?.details?.imageLinks?.[0] || '/placeholder-laptop.jpg'}
                        alt={laptop.specs?.head}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="laptop-title">{laptop.specs?.head}</h3>
                    <p className="laptop-brand">{laptop.brand} {laptop.series}</p>
                    <button
                      onClick={() => removeFromCompare(laptop._id)}
                      className="remove-btn"
                      title="Remove from comparison"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {/* Add laptop column if less than 3 */}
                {comparedLaptops.length < 3 && (
                  <div className="add-laptop-col">
                    <div className="add-laptop-placeholder">
                      <div className="add-icon">+</div>
                      <p className="add-text">Add Another Laptop</p>
                      <button
                        onClick={() => navigate('/search')}
                        className="add-btn"
                      >
                        Browse Laptops
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Specification Rows */}
              {comparisonSpecs.map((spec) => {
                const values = comparedLaptops.map(laptop => spec.getValue(laptop));
                
                return (
                  <div key={spec.label} className="compare-row">
                    <div className="spec-label">{spec.label}</div>
                    {comparedLaptops.map((laptop, laptopIndex) => {
                      const value = values[laptopIndex];
                      let colorClass = 'neutral';
                      
                      if (spec.type === 'processor') {
                        // Check if all processors are comparable
                        const allComparable = values.every(v => 
                          values.every(v2 => isProcessorComparable(v.toString(), v2.toString()))
                        );
                        if (!allComparable) {
                          colorClass = 'incomparable';
                        }
                      } else {
                        colorClass = getComparisonColor(spec, value, values);
                      }
                      
                      return (
                        <div key={laptop._id} className={`spec-value ${colorClass}`}>
                          {formatValue(spec, value)}
                          {spec.type === 'processor' && !values.every(v => 
                            values.every(v2 => isProcessorComparable(v.toString(), v2.toString()))
                          ) && (
                            <div className="incomparable-note">
                              Different processor types
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Empty cell for add column */}
                    {comparedLaptops.length < 3 && (
                      <div className="spec-value empty">-</div>
                    )}
                  </div>
                );
              })}

              {/* Action Row */}
              <div className="compare-row actions-row">
                <div className="spec-label">Actions</div>
                {comparedLaptops.map((laptop) => (
                  <div key={laptop._id} className="spec-value">
                    <button
                      onClick={() => navigate(`/laptop/${laptop._id}`)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                {comparedLaptops.length < 3 && (
                  <div className="spec-value empty">-</div>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="glass-card p-6 rounded-xl border border-purple-500/30 mt-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Color Legend</h3>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Best Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span>Second Best</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Lowest Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span>Not Comparable</span>
              </div>
            </div>
            <p className="text-center text-white/60 text-xs mt-4">
              * For price, lower values are better. For other specs, higher values are better.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
