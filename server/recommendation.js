// recommendation.js

const express = require('express');
const router = express.Router();

const User = require('./model/users');      // Adjust path if your users model is elsewhere
const Laptop = require('./model/Laptop');   // Adjust path if your Laptop model is elsewhere

// ==============================
//   ONE-HOT CATEGORIES & HELPERS
// ==============================

// You may wish to extend this list based on your actual brand/processor mix.
const BRANDS = ['hp', 'dell', 'lenovo', 'asus', 'acer', 'msi', 'apple', 'other'];
const PROC_TYPES = ['intel', 'amd', 'applesilicon', 'other'];
// Stringify generations ("8", "9", "10", "11", "12", "13", "14", "other").
const PROC_GENS = ['8', '9', '10', '11', '12', '13', '14', 'other'];
const RAM_TYPES = ['ddr3', 'ddr4', 'ddr5', 'lpddr4', 'lpddr4x', 'lpddr5', 'other'];
const STOR_TYPES = ['hdd', 'ssd', 'nvme', 'emmc', 'other'];

/**
 * oneHot(list, val)
 *   - list: an array of possible lowercase categories.
 *   - val:  the actual string (case-insensitive).
 * Returns an array of length list.length with a 1 at the index where list[i] === val (lowercased), else 0.
 * If val not found, marks ‘other’ (if present) or returns all zeros.
 */
function oneHot(list, val) {
  if (!val || typeof val !== 'string') {
    // If there's an explicit 'other' in list, one-hot that; else all 0s
    return list.includes('other')
      ? list.map(x => (x === 'other' ? 1 : 0))
      : list.map(() => 0);
  }
  const low = val.toLowerCase();
  if (list.includes(low)) {
    return list.map(x => (x === low ? 1 : 0));
  } else if (list.includes('other')) {
    return list.map(x => (x === 'other' ? 1 : 0));
  } else {
    return list.map(() => 0);
  }
}

/**
 * logPrice(p)
 *   - p: raw price (Number or null/undefined).
 * Returns Math.log(p + 1) to dampen large price differences.
 */
function logPrice(p) {
  return Math.log((p || 0) + 1);
}

/**
 * buildFeatureVector(laptopDoc)
 *   - laptopDoc: a Mongoose document (or plain JS object) with the fields:
 *       specs.ram.size, specs.ram.type,
 *       specs.storage.size, specs.storage.type,
 *       specs.displayInch,
 *       specs.gpu (truthy string if dedicated, else undefined/null/empty),
 *       brand,
 *       specs.processor.name, specs.processor.gen
 *       sites: [ { price: Number, … }, ... ]
 *
 * Returns a flat numeric array containing:
 *   [ ramSize, storageSize, displayInch, priceLog, hasGPU,
 *     ...brandOneHot, ...procTypeOneHot, ...procGenOneHot, ...ramTypeOneHot, ...storTypeOneHot ]
 */
function buildFeatureVector(laptop) {
  // — Numeric features —
  const ramSize = laptop.specs?.ram?.size ? Number(laptop.specs.ram.size) : 0; // GB
  const storageSize = laptop.specs?.storage?.size ? Number(laptop.specs.storage.size) : 0; // GB
  const displayInch = laptop.specs?.displayInch ? Number(laptop.specs.displayInch) : 0; // inches

  // Determine a representative price (lowest among all sites)
  let representativePrice = 0;
  if (Array.isArray(laptop.sites) && laptop.sites.length > 0) {
    const prices = laptop.sites
      .map(s => (typeof s.price === 'number' && s.price >= 0 ? s.price : Infinity))
      .filter(v => v < Infinity);
    if (prices.length > 0) {
      representativePrice = Math.min(...prices);
    }
  }
  const priceLog = logPrice(representativePrice);

  // — GPU flag (1 if specs.gpu is truthy & not 'integrated'/empty) —
  // You can tweak logic if you store integrated vs. dedicated differently.
  const hasGPU = laptop.specs?.gpu && String(laptop.specs.gpu).toLowerCase() !== 'integrated' ? 1 : 0;

  // — One-hot encodings —

  // 1) Brand (lowercase)
  const brandVal = laptop.brand ? String(laptop.brand).toLowerCase() : '';
  const brandVec = oneHot(BRANDS, brandVal);

  // 2) Processor type (take first token of specs.processor.name, e.g. “Intel” or “AMD”)
  let rawProcType = '';
  if (laptop.specs?.processor?.name) {
    rawProcType = String(laptop.specs.processor.name).split(' ')[0].toLowerCase();
  }
  const procTypeVec = oneHot(PROC_TYPES, rawProcType);

  // 3) Processor generation (stringify, else ’other’)
  const rawGen = laptop.specs?.processor?.gen
    ? String(laptop.specs.processor.gen)
    : '';
  const procGenVec = oneHot(PROC_GENS, rawGen);

  // 4) RAM type
  const rawRamType = laptop.specs?.ram?.type
    ? String(laptop.specs.ram.type).toLowerCase()
    : '';
  const ramTypeVec = oneHot(RAM_TYPES, rawRamType);

  // 5) Storage type
  const rawStorType = laptop.specs?.storage?.type
    ? String(laptop.specs.storage.type).toLowerCase()
    : '';
  const storTypeVec = oneHot(STOR_TYPES, rawStorType);

  // — Assemble the feature vector in this exact order —
  return [
    ramSize,
    storageSize,
    displayInch,
    priceLog,
    hasGPU,
    ...brandVec,
    ...procTypeVec,
    ...procGenVec,
    ...ramTypeVec,
    ...storTypeVec,
  ];
}

/**
 * cosineSimilarity(a, b)
 *   - a, b: two numeric arrays of the same length.
 * Returns the cosine similarity: (a·b)/(||a|| * ||b||). If either vector has zero magnitude, returns 0.
 */
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    throw new Error('Vectors must be equal-length arrays');
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// ==============================
//   RECOMMENDATION ROUTE
// ==============================

/**
 * GET /api/recommendations/:userId
 *   - Fetches user by ID, populates ‘history’ (array of Laptop IDs),
 *   - Builds a feature vector for each laptop in history,
 *   - Averages them to form a “profile” vector,
 *   - Fetches all laptops, filters out those in history,
 *   - Computes cosine similarity against each, sorts by descending score,
 *   - Returns top 5 as JSON.
 */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // 1) Load user + populate history
    const user = await User.findById(userId).populate('history').exec();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // 2) If user has no history, return empty array
    if (!Array.isArray(user.history) || user.history.length === 0) {
      return res.json({ success: true, recommendations: [] });
    }

    // 3) Build feature vectors for each laptop in history
    const historyVectors = user.history.map(laptopDoc => buildFeatureVector(laptopDoc));

    // 4) Average them to get profile vector
    const vectorLength = historyVectors[0].length;
    const profileVector = new Array(vectorLength).fill(0);
    historyVectors.forEach(vec => {
      for (let i = 0; i < vectorLength; i++) {
        profileVector[i] += vec[i];
      }
    });
    for (let i = 0; i < vectorLength; i++) {
      profileVector[i] /= historyVectors.length;
    }

    // 5) Fetch all laptops
    const allLaptops = await Laptop.find({}).exec();

    // 6) Filter out those already in history and compute similarity
    const historyIds = new Set(user.history.map(l => l._id.toString()));
    const scored = allLaptops
      .filter(lap => !historyIds.has(lap._id.toString()))
      .map(lap => {
        const vec = buildFeatureVector(lap);
        const score = cosineSimilarity(profileVector, vec);
        return { laptop: lap, score };
      });

    // 7) Sort by descending similarity & take top 5
    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5).map(entry => {
      const laptop = entry.laptop;

      // Extract pricing data from sites
      let amazonPrice = null;
      let flipkartPrice = null;
      let amazonRating = null;
      let flipkartRating = null;
      let amazonUrl = null;
      let flipkartUrl = null;
      let basePrice = null;

      if (laptop.sites && laptop.sites.length > 0) {
        const amazonSite = laptop.sites.find(site => site.source === 'amazon');
        const flipkartSite = laptop.sites.find(site => site.source === 'flipkart');

        if (amazonSite) {
          amazonPrice = amazonSite.price;
          amazonRating = amazonSite.rating;
          amazonUrl = amazonSite.link;
        }

        if (flipkartSite) {
          flipkartPrice = flipkartSite.price;
          flipkartRating = flipkartSite.rating;
          flipkartUrl = flipkartSite.link;
        }

        // Use the lowest price as the main price
        basePrice = laptop.allTimeLowPrice || laptop.specs?.basePrice;
      }

      return {
        id: laptop._id,
        title: laptop.specs?.head || laptop.specs?.details?.['Product Name'] || 'Unknown Model',
        brand: laptop.brand,
        series: laptop.series || '',
        amazonPrice: amazonPrice,
        amazonRating: amazonRating,
        amazonUrl: amazonUrl,
        flipkartPrice: flipkartPrice,
        flipkartRating: flipkartRating,
        flipkartUrl: flipkartUrl,
        basePrice: basePrice,
        images: laptop.specs?.details?.imageLinks || [],
        processor: laptop.specs?.processor?.name || 'Unknown Processor',
        ram: laptop.specs?.ram ? `${laptop.specs.ram.size || ''}${laptop.specs.ram.size ? 'GB' : ''} ${laptop.specs.ram.type || ''}`.trim() : 'Unknown RAM',
        storage: laptop.specs?.storage ? `${laptop.specs.storage.size || ''}${laptop.specs.storage.size ? 'GB' : ''} ${laptop.specs.storage.type || ''}`.trim() : 'Unknown Storage',
        score: entry.score.toFixed(3),
      };
    });

    return res.json({ success: true, recommendations: top5 });
  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
