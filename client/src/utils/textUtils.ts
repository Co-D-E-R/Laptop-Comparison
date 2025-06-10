/**
 * Text formatting utilities for proper display of laptop specifications
 * Handles capitalization, proper case, and special formatting rules
 */

// Brand name mappings for proper capitalization
const BRAND_MAPPINGS: Record<string, string> = {
  'hp': 'HP',
  'dell': 'Dell',
  'lenovo': 'Lenovo',
  'asus': 'ASUS',
  'acer': 'Acer',
  'apple': 'Apple',
  'msi': 'MSI',
  'samsung': 'Samsung',
  'lg': 'LG',
  'sony': 'Sony',
  'toshiba': 'Toshiba',
  'fujitsu': 'Fujitsu',
  'panasonic': 'Panasonic',
  'microsoft': 'Microsoft',
  'alienware': 'Alienware'
};

// Series name mappings for proper capitalization
const SERIES_MAPPINGS: Record<string, string> = {
  // Lenovo
  'thinkpad': 'ThinkPad',
  'ideapad': 'IdeaPad',
  'legion': 'Legion',
  'yoga': 'Yoga',
  'yogabook': 'YogaBook',
  'thinkbook': 'ThinkBook',
  'loq': 'LOQ',
  'workstation': 'Workstation',
  
  // HP
  'pavilion': 'Pavilion',
  'envy': 'ENVY',
  'spectre': 'Spectre',
  'omen': 'OMEN',
  'victus': 'Victus',
  'elitebook': 'EliteBook',
  'probook': 'ProBook',
  'zbook': 'ZBook',
  'dragonfly': 'Dragonfly',
  'folio': 'Folio',
  
  // Dell
  'xps': 'XPS',
  'inspiron': 'Inspiron',
  'latitude': 'Latitude',
  'vostro': 'Vostro',
  'alienware': 'Alienware',
  'precision': 'Precision',
  'g-series': 'G-Series',
  'g15': 'G15',
  'g16': 'G16',
  'g3': 'G3',
  'g5': 'G5',
  'g7': 'G7',
  
  // ASUS
  'rog': 'ROG',
  'rog zephyrus': 'ROG Zephyrus',
  'rog strix': 'ROG Strix',
  'rog flow': 'ROG Flow',
  'rog scar': 'ROG SCAR',
  'zenbook': 'ZenBook',
  'zenbook pro': 'ZenBook Pro',
  'zenbook flip': 'ZenBook Flip',
  'vivobook': 'VivoBook',
  'tuf': 'TUF',
  'tuf gaming': 'TUF Gaming',
  
  // Acer
  'aspire': 'Aspire',
  'swift': 'Swift',
  'swift go': 'Swift Go',
  'nitro': 'Nitro',
  'nitro 5': 'Nitro 5',
  'predator': 'Predator',
  'predator helios': 'Predator Helios',
  'predator triton': 'Predator Triton',
  'travelmate': 'TravelMate',
  'chromebook': 'Chromebook',
  'spin': 'Spin',
  'extensa': 'Extensa',
  'conceptd': 'ConceptD',
  'enduro': 'Enduro',
  'veriton': 'Veriton',
  
  // Apple
  'macbook': 'MacBook',
  'macbook air': 'MacBook Air',
  'macbook pro': 'MacBook Pro',
  'imac': 'iMac',
  'mac mini': 'Mac Mini',
  'mac studio': 'Mac Studio',
  'mac pro': 'Mac Pro',
  
  // MSI
  'stealth': 'Stealth',
  'katana': 'Katana',
  'pulse': 'Pulse',
  'vector': 'Vector',
  'sword': 'Sword',
  'creator': 'Creator',
  'modern': 'Modern',
  'summit': 'Summit',
  'bravo': 'Bravo',
  'alpha': 'Alpha',
  'raider': 'Raider'
};

// Processor name mappings for proper formatting
const PROCESSOR_MAPPINGS: Record<string, string> = {
  // Intel processors
  'i3': 'Intel Core i3',
  'i5': 'Intel Core i5',
  'i7': 'Intel Core i7',
  'i9': 'Intel Core i9',
  'core ultra 5': 'Intel Core Ultra 5',
  'core ultra 7': 'Intel Core Ultra 7',
  'core ultra 9': 'Intel Core Ultra 9',
  'pentium': 'Intel Pentium',
  'celeron': 'Intel Celeron',
  
  // AMD processors
  'ryzen3': 'AMD Ryzen 3',
  'ryzen5': 'AMD Ryzen 5',
  'ryzen7': 'AMD Ryzen 7',
  'ryzen9': 'AMD Ryzen 9',
  'ryzen': 'AMD Ryzen',
  'athlon': 'AMD Athlon',
  'ryzen z': 'AMD Ryzen Z',
  'ryzen r': 'AMD Ryzen R',
  
  // Apple processors
  'm1': 'Apple M1',
  'm2': 'Apple M2',
  'm3': 'Apple M3',
  'm4': 'Apple M4',
  
  // Other processors
  'snapdragon': 'Qualcomm Snapdragon',
  'mediatek': 'MediaTek',
  'exynos': 'Samsung Exynos'
};

// RAM type mappings
const RAM_TYPE_MAPPINGS: Record<string, string> = {
  'ddr3': 'DDR3',
  'ddr4': 'DDR4',
  'ddr5': 'DDR5',
  'lpddr3': 'LPDDR3',
  'lpddr4': 'LPDDR4',
  'lpddr4x': 'LPDDR4X',
  'lpddr5': 'LPDDR5',
  'lpddr5x': 'LPDDR5X'
};

/**
 * Formats brand names with proper capitalization
 */
export function formatBrand(brand: string | null | undefined): string {
  if (!brand) return 'Unknown Brand';
  
  const normalizedBrand = brand.toLowerCase().trim();
  return BRAND_MAPPINGS[normalizedBrand] || capitalizeFirst(brand);
}

/**
 * Formats series names with proper capitalization
 */
export function formatSeries(series: string | null | undefined): string {
  if (!series) return 'Unknown Series';
  
  const normalizedSeries = series.toLowerCase().trim();
  return SERIES_MAPPINGS[normalizedSeries] || capitalizeWords(series);
}

/**
 * Formats processor names with proper brands and capitalization
 */
export function formatProcessor(processor: string | null | undefined): string {
  if (!processor) return 'Unknown Processor';
  
  const normalizedProcessor = processor.toLowerCase().trim();
  
  // Check exact mappings first
  if (PROCESSOR_MAPPINGS[normalizedProcessor]) {
    return PROCESSOR_MAPPINGS[normalizedProcessor];
  }
  
  // Handle common processor patterns
  let formatted = processor;
  
  // Intel Core patterns
  if (/\bi[3579]\b/i.test(formatted)) {
    formatted = formatted.replace(/\bi([3579])\b/gi, 'Intel Core i$1');
  }
  
  // AMD Ryzen patterns
  if (/\bryzen\s*[3579]\b/i.test(formatted)) {
    formatted = formatted.replace(/\bryzen\s*([3579])\b/gi, 'AMD Ryzen $1');
  }
  
  // Clean up multiple spaces and capitalize
  formatted = formatted.replace(/\s+/g, ' ').trim();
  return capitalizeWords(formatted);
}

/**
 * Formats RAM type with proper capitalization
 */
export function formatRAMType(ramType: string | null | undefined): string {
  if (!ramType) return '';
  
  const normalizedType = ramType.toLowerCase().trim();
  return RAM_TYPE_MAPPINGS[normalizedType] || ramType.toUpperCase();
}

/**
 * Formats storage type with proper capitalization
 */
export function formatStorageType(storageType: string | null | undefined): string {
  if (!storageType) return '';
  
  const type = storageType.toLowerCase().trim();
  
  switch (type) {
    case 'ssd': return 'SSD';
    case 'hdd': return 'HDD';
    case 'emmc': return 'eMMC';
    case 'nvme': return 'NVMe SSD';
    case 'pcie': return 'PCIe SSD';
    case 'sata': return 'SATA';
    case 'hybrid': return 'Hybrid';
    default: return capitalizeFirst(storageType);
  }
}

/**
 * Formats GPU names with proper capitalization
 */
export function formatGPU(gpu: string | null | undefined): string {
  if (!gpu) return '';
  
  let formatted = gpu.trim();
  
  // NVIDIA formatting
  if (/nvidia/i.test(formatted)) {
    formatted = formatted.replace(/nvidia/gi, 'NVIDIA');
    formatted = formatted.replace(/geforce/gi, 'GeForce');
    formatted = formatted.replace(/rtx/gi, 'RTX');
    formatted = formatted.replace(/gtx/gi, 'GTX');
    formatted = formatted.replace(/quadro/gi, 'Quadro');
  }
  
  // AMD formatting
  if (/amd/i.test(formatted)) {
    formatted = formatted.replace(/amd/gi, 'AMD');
    formatted = formatted.replace(/radeon/gi, 'Radeon');
    formatted = formatted.replace(/vega/gi, 'Vega');
    formatted = formatted.replace(/navi/gi, 'NAVI');
  }
  
  // Intel formatting
  if (/intel/i.test(formatted)) {
    formatted = formatted.replace(/intel/gi, 'Intel');
    formatted = formatted.replace(/uhd/gi, 'UHD');
    formatted = formatted.replace(/iris/gi, 'Iris');
    formatted = formatted.replace(/xe/gi, 'Xe');
  }
  
  return formatted;
}

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalizes the first letter of each word
 */
function capitalizeWords(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a complete processor specification with name, generation, and variant
 */
export function formatProcessorSpec(processor: {
  name?: string;
  gen?: string | number;
  variant?: string;
} | null | undefined): string {
  if (!processor) return 'Unknown Processor';
  
  let parts: string[] = [];
  
  if (processor.name) {
    parts.push(formatProcessor(processor.name));
  }
  
  if (processor.gen) {
    parts.push(`${processor.gen}th Gen`);
  }
  
  if (processor.variant) {
    parts.push(processor.variant.toUpperCase());
  }
  
  return parts.join(' ');
}

/**
 * Formats a complete RAM specification with size and type
 */
export function formatRAMSpec(ram: {
  size?: string | number;
  type?: string;
} | null | undefined): string {
  if (!ram) return 'Unknown RAM';
  
  let parts: string[] = [];
  
  if (ram.size) {
    parts.push(`${ram.size}GB`);
  }
  
  if (ram.type) {
    parts.push(formatRAMType(ram.type));
  }
  
  return parts.join(' ');
}

/**
 * Formats display size with proper units
 */
export function formatDisplaySize(size: string | number | null | undefined): string {
  if (!size) return '';
  
  const numericSize = typeof size === 'string' ? parseFloat(size) : size;
  
  if (isNaN(numericSize)) return '';
  
  return `${numericSize}"`;
}

/**
 * Formats color names with proper capitalization
 */
export function formatColor(color: string | null | undefined): string {
  if (!color) return '';
  
  return capitalizeWords(color);
}

/**
 * Formats manufacturer names with proper capitalization
 */
export function formatManufacturer(manufacturer: string | null | undefined): string {
  if (!manufacturer) return '';
  
  return formatBrand(manufacturer);
}

/**
 * Extracts and formats a clean model name from a full product description
 */
export function formatModel(productHead: string | null | undefined): string {
  if (!productHead) return 'Unknown Model';
  
  let cleanModel = productHead.trim();
  
  // Remove common prefixes (brand names)
  const brandPrefixes = Object.keys(BRAND_MAPPINGS).map(brand => 
    brand.toLowerCase()
  ).concat(Object.values(BRAND_MAPPINGS));
  
  for (const brand of brandPrefixes) {
    const regex = new RegExp(`^${brand}\\s+`, 'gi');
    cleanModel = cleanModel.replace(regex, '');
  }
  
  // Extract model name patterns - typically the first few words before specifications
  const modelPatterns = [
    // Pattern: Series Model (e.g., "ThinkPad X1", "XPS 13", "Pavilion 15")
    /^([a-zA-Z]+\s+[a-zA-Z0-9]+)(?:\s+[a-zA-Z]+)*/,
    // Pattern: Series Model Number (e.g., "Raider 18 HX", "Inspiron 3520")
    /^([a-zA-Z]+\s+\d+(?:\s+[a-zA-Z]+)?)/,
    // Pattern: Just the first word or two if no clear pattern
    /^([a-zA-Z]+(?:\s+[a-zA-Z0-9]+)?)/
  ];
  
  for (const pattern of modelPatterns) {
    const match = cleanModel.match(pattern);
    if (match) {
      cleanModel = match[1].trim();
      break;
    }
  }
  
  // Remove common suffixes and technical details
  const suffixesToRemove = [
    /,.*$/, // Everything after first comma
    /\s+with\s+.*$/i,
    /\s+featuring\s+.*$/i,
    /\s+intel\s+.*$/i,
    /\s+amd\s+.*$/i,
    /\s+\d+gb\s+.*$/i,
    /\s+\d+"\s+.*$/i,
    /\s+laptop.*$/i,
    /\s+gaming.*$/i,
    /\s+business.*$/i,
    /\s+workstation.*$/i,
    /\s+ultrabook.*$/i,
    /\s+notebook.*$/i
  ];
  
  for (const suffix of suffixesToRemove) {
    cleanModel = cleanModel.replace(suffix, '');
  }
  
  // Clean up and format
  cleanModel = cleanModel.trim();
  
  // Apply proper formatting to series names if recognized
  const words = cleanModel.split(' ');
  const formattedWords = words.map(word => {
    const lowerWord = word.toLowerCase();
    return SERIES_MAPPINGS[lowerWord] || capitalizeFirst(word);
  });
  
  const finalModel = formattedWords.join(' ');
  
  // Fallback: if the result is too short or generic, return a more descriptive name
  if (finalModel.length < 3 || /^(laptop|notebook|computer)$/i.test(finalModel)) {
    // Try to extract from the original string using different approach
    const fallbackMatch = productHead.match(/^[^,]+/);
    return fallbackMatch ? fallbackMatch[0].trim() : 'Unknown Model';
  }
  
  return finalModel;
}

/**
 * General text formatter that applies common formatting rules
 */
export function formatText(text: string | null | undefined): string {
  if (!text) return '';
  
  return capitalizeWords(text.trim());
}
