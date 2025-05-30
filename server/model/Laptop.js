const mongoose = require('mongoose');

const LaptopSchema = new mongoose.Schema({
  brand: { type: String, required: false, index: true },    // e.g. "hp"
  series: { type: String, required: false, index: true },    // e.g. "15s"

  specs: {
    head: { type: String, required: false },                 // full title/headline
    processor: {
      name: { type: String, required: false },                 // e.g. "i3"
      gen: { type: String, required: false },                 // e.g. "12"
      variant: { type: String, required: false }                  // e.g. "1215U"
    },
    ram: {
      size: { type: Number, required: false },                 // in GB
      type: { type: String, required: false }                  // e.g. "DDR4"
    },
    storage: {
      size: { type: Number, required: false },                 // in GB
      type: { type: String, required: false }                  // e.g. "SSD"
    },
    displayInch: { type: Number, required: false },                 // e.g. 15.6
    gpu: { type: String, required: false },                 // e.g. "Intel"
    gpuVersion: { type: String, default: "" },                     // optional extra
    touch: { type: String, default: false },                  // touchscreen?
    ratingCount: { type: String, default: 0 },                      // aggregated?
    basePrice: { type: Number, required: false },                 // base/MRP price
    // allDetails holds the full Amazon or Flipkart specs object
    details: { type: mongoose.Schema.Types.Mixed, required: false }
  },

  // which sites this model appears on, with per-site pricing & links
  sites: [
    {
      source: { type: String, enum: ['amazon', 'flipkart'], required: false },
      price: { type: Number, required: false },
      link: { type: String, required: false },
      rating: { type: Number, default: null },
      ratingCount: { type: Number, default: 0 },
      basePrice: { type: Number, required: false }                   // site-specific base/MRP price
    }
  ],

  allTimeLowPrice: { type: Number, required: false }                  // lowest price across all sites
},
  {
    timestamps: true
  });

// Indexes for faster searches
LaptopSchema.index({ brand: 1, series: 1 });
LaptopSchema.index({ 'specs.processor.name': 1, 'specs.processor.gen': 1 });
LaptopSchema.index({ 'specs.ram.size': 1, 'specs.storage.size': 1 });
LaptopSchema.index({ 'sites.source': 1, 'sites.price': 1 });
LaptopSchema.index({ allTimeLowPrice: 1 });  // Add index for allTimeLowPrice for price-based searches

module.exports = mongoose.model('Laptop', LaptopSchema);