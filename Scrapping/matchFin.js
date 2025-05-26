// matchLaptops.js

const fs = require('fs');
const { type } = require('os');
const path = require('path');

// --- Utilities ---
const norm = s => (s || '').toString().toLowerCase().trim();
const stripUnits = s => (s || '').toString().replace(/(gb|tb|cm|inch|")/gi, '').trim();

function extractSeries(name) {
  const keywords = [
    'ideapad 3', 'ideapad 5', 'ideapad slim 3', 'ideapad slim 5', 'ideapad' , 'thinkpad', 'victus 15', 'victus', 'omen', 'pavilion x360', 'pavilion', 'aspire',
    'nitro 5', 'nitro v', 'elitebook', 'zbook', 'v15', 'v14', '15s', 'professional', 'one', 'yoga',
    'yogabook', 'chromebook', '240 G9', '14s', '255 g8', '255 g9', '255 g10', 'zbook', 'fire fly', '250 g8',
    'spectre x360', 'probook', 'alienware', 'vivobook', 'zenbook', 'rog', 'tuf',
    'predator', 'inspiron', 'latitude', 'envy', 'spectre',

    //Acer
    'swift go 14', ' swift 14', 'swift 3', 'swift X', 'swift', 'travelmate', 'extensa', 'spin', 'chromebook', 'predator helios', 'predator triton', 'predator', 'aspire', 'nitro', 'conceptd', 'enduro', 'veriton', 'travelmate p2', 'travelmate p4', 'travelmate p6', 'travelmate p8',
    //Dell
    'xps', 'latitude', 'inspiron', 'vostro', 'alienware', 'precision', 'g-series', 'g15', 'g16', 'g3', 'g5', 'g7',
    //MSI
    'stealth', 'katana', 'pulse', 'vector', 'sword', 'creator', 'modern', 'summit', 'bravo', 'alpha' ,'raider',
    //Apple
    'macbook air', 'macbook pro', 'imac', 'mac mini', 'mac studio', 'mac pro',
    //Lenovo
    'thinkbook', 'thinkcentre', 'thinkstation', 'ideacentre', 'yoga slim', 'legion slim', 'legion Pro', 'legion 5', 'legion 7', 'loq', 'workstation', ' legion',
    //HP
    'elite dragonfly', 'elite folio', 'elite x2', 'elitebook x360', 'spetrex360',  'spectre', 'envy', 'pavilion gaming',
    //Asus
    'rog zephyrus', 'rog strix', 'rog flow', 'rog scar', 'rog mothership', 'rog swift', 'rog ally', 'zenbook pro', 'zenbook flip',
    //Acer
    'aspire Vero', 'aspire 5', 'aspire 7', 'aspire 9', 'aspire 3', 'aspire 1', 'aspire C', 'aspire S',
    , '15', '14'

  ];
  const lower = norm(name);
  for (let kw of keywords) {
    if (lower.includes(kw)) return kw;
  }
  return '';
}

function extractModel(name) {
  const lower = norm(name);
  const match = lower.match(/(lenovo|hp|asus|acer|dell|msi|apple)/);
  return match ? match[0] : '';
}

function extractProcessor(name) {
  const lower = norm(name);

  // Intel Core Ultra 5/7/9
  let match = lower.match(/core\s+ultra\s*([579])/);
  if (match) return `core ultra ${match[1]}`;

  // Intel i3, i5, i7, i9
  match = lower.match(/\bi[3579]\b/);
  if (match) return match[0];

  // AMD Ryzen 3/5/7/9
  match = lower.match(/ryzen\s*([3579])/);
  if (match) return `ryzen`;

  // AMD Athlon
  match = lower.match(/amd\s+athlon/);
  if (match) return 'athlon';

  // Apple M1/M2/M3
  match = lower.match(/m[123]/);
  if (match) return match[0];

  // Apple A-series
  match = lower.match(/apple\s+a(\d+)/);
  if (match) return `a${match[1]}`;

  // Celeron
  match = lower.match(/celeron/);
  if (match) return 'celeron';

  // Pentium
  match = lower.match(/pentium\s*(gold|silver)?/);
  if (match) return 'pentium';

  // Snapdragon
  match = lower.match(/snapdragon/);
  if (match) return 'snapdragon';

  // MediaTek
  match = lower.match(/mediatek|mt\d+/);
  if (match) return 'mediatek';

  // Exynos
  match = lower.match(/exynos/);
  if (match) return 'exynos';

  // ARM Cortex
  match = lower.match(/arm\s*cortex[-\s]*([a-z\d]+)/);
  if (match) return `cortex-${match[1]}`;

  match = lower.match(/u([579])/i);
  if (match) return `core ultra ${match[1]}`;

  match = lower.match(/ryzen\s*z\d|z-series/i);
  if (match) return 'ryzen z';

  match = lower.match(/ryzen\s*r(\d)/i);
  if (match) return 'ryzen r';

  match = lower.match(/core\s+([3579])\b/i);
  if (match) return `core ${match[1]}`;

  return '';
}






function findProcessorVariantFromList(text) {
  const variants = allProcessorVariants();

  // Iterate through all processor families
  for (const family in variants) {
    const variantList = variants[family];

    for (const variant of variantList) {
      const pattern = new RegExp(`\\b${variant}\\b`, 'i');
      if (pattern.test(text)) {
        return variant.toUpperCase();
      }
    }
  }

  return '';
}


function extractProcessorVariant(name) {
  if (!name) return '';

  const normalized = name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();



  // Check for AMD Ryzen variants
  let match = normalized.match(/ryzen\s*[3579]\s*(?:pro\s*)?.*?(\d{3,4}(?:x3d|xt|ge|hs|hx|h|u|g|x|s)?)/i);
  if (match) return match[1].toUpperCase();


  // Add this near the top of your extractProcessorVariant function
  match = normalized.match(/i[3579][\s-]+(\d{4,5})\s+([a-z](?:k|kf|x|xt|h|hk|hx|hs|u|g|t)?)/i);
  if (match) return (match[1] + match[2]).toUpperCase();

  // NEW PATTERN: Model numbers in parentheses
  match = normalized.match(/i[3579].*?\((\d{4,5}[a-z]*)\)/i);
  if (match) return match[1].toUpperCase();

  // For Intel with generation followed by full model number
  match = normalized.match(/i[3579].*?(?:\d+)(?:th|nd|rd|st)?\s*gen(?:eration)?\s*(\d{4,5}[a-z]*)/i);
  if (match) return match[1].toUpperCase();



  // NEW PATTERN: Intel with hyphen (i3-1215U format)
  match = normalized.match(/i[3579][\s-]+(\d{4,5}[a-z]*)/i);
  if (match) return match[1].toUpperCase();

  // NEW PATTERN: Core Ultra with 3-digit model
  match = normalized.match(/core\s+ultra\s+([579])\s+(\d{3}[a-z]*)/i);
  if (match) return match[2].toUpperCase();

  // Check for Intel variants - with generation
  match = normalized.match(/(core\s+(?:ultra\s*)?)(i[3579]|ultra\s*[579]|pentium|celeron)\s*(?:[\w-]*\s+)?(\d{1,2})(?:th|nd|rd|st)?\s*gen(?:eration)?\s*(\d{4}[a-z]*)/i);
  if (match) return match[4].toUpperCase();

  // Intel without gen
  match = normalized.match(/(core\s+(?:ultra\s*)?)(i[3579]|ultra\s*[579]|pentium|celeron)\s*(?:[\w-]*\s+)?(\d{4,5}[a-z]*)/i);
  if (match) return match[3].toUpperCase();

  // Pentium Gold/Silver
  match = normalized.match(/pentium\s*gold\s*(\d{4})/i);
  if (match) return match[1].toUpperCase();

  // AMD Athlon pattern
  match = normalized.match(/athlon\s*(?:silver|gold)?\s*(\d{4}[a-z]*)/i);
  if (match) return match[1].toUpperCase();

  // Celeron N-series pattern
  match = normalized.match(/celeron\s*((?:n|j)?)(\d{4})/i);
  if (match) return (match[1] + match[2]).toUpperCase();

  match = normalized.match(/u[579][- ](\d{3}[a-z]*)/i);
  if (match) return match[1].toUpperCase();

  match = normalized.match(/ryzen\s*ai\s*[3579]\s*(\d{3})/i);
  if (match) return match[1].toUpperCase();

  match = normalized.match(/ryzen\s*z(\d)(?:\s*(extreme))?/i);
  if (match) return (`Z${match[1]}` + (match[2] ? ' EXTREME' : '')).toUpperCase();

  match = normalized.match(/ryzen\s*r(\d)(?:\s*(extreme))?/i);
  if (match) return (`R${match[1]}` + (match[2] ? ' EXTREME' : '')).toUpperCase();

  match = normalized.match(/core\s+([3579])\s+(\d{3}[a-z]*)/i);
  if (match) return match[2].toUpperCase();

  match = normalized.match(/core\s+([3579])\s+processor\s+(\d{3}[a-z]*)/i);
  if (match) return match[2].toUpperCase();

  match = normalized.match(/core\s+ultra\s+[579].*?series\s+2.*?(\d{3}[a-z]*)/i) ||
    normalized.match(/(?:u7-lul|lunalake).*?(\d{3}[a-z]*)/i);
  if (match) return match[1].toUpperCase();

  match = normalized.match(/core\s+ultra\s+[579][\s-]+(\d{3}[a-z]*)/i);
  if (match) return match[1].toUpperCase();

  match = normalized.match(/athlon\s*(pro)?\s*(\d{4}[a-z]*)/i);
  if (match) return match[2].toUpperCase();

  // For Intel with space between number and suffix (12900 H)
  match = normalized.match(/(core\s+(?:ultra\s*)?)(i[3579]|ultra\s*[579]|pentium|celeron)\s*(?:[\w-]*\s+)?(\d{4,5})\s+([a-z])/i);
  if (match) return (match[3] + match[4]).toUpperCase();


  return findProcessorVariantFromList(normalized);
}

function allProcessorVariants() {
  return {

    "core_series": [
      "120U", "124U", "128U", "130U", "135U", "140U", "150U", "160U", "170U", "180U", "190U", "200U", "210U", "220U", "230U", "240U", "250U", "260U", "270U", "280U",
      "290U", "300U", "310U", "320U", "330U", "340U", "350U", "360U", "370U", "380U", "390U",
    ],

    "core_ultra_series2": [
      "258V", "268V", "165V", "155V", "EVO 258V", "EVO 268V", "EVO 165V", "EVO 155V", "EVO 175V", "EVO 185V", "EVO 195V", "EVO 205V", "EVO 215V", "EVO 225V", "EVO 235V", "EVO 245V", "EVO 255V",
      "EVO 265V", "EVO 275V", "EVO 285V", "EVO 295V", "EVO 305V", "EVO 315V", "EVO 325V", "EVO 335V", "EVO 345V", "EVO 355V", "EVO 365V", "EVO 375V", "EVO 385V"
    ],
    // Intel Core 11th Gen (Tiger Lake)
    "11th_gen_core": [
      "1165G7", "1155G7", "1135G7", "1115G4", "1125G4", "11300H", "11370H",
      "11390H", "11600H", "11800H", "11850H", "11900H", "11950H", "11400H", "11500H", "11600H", "11700H", "11800H", "11900H", "11950H",
      "11900HK", "11900HX", "1130H", "1140H", "1150H", "1160H", "1170H", "1180H", "1190H"
    ],

    // Intel Core 12th Gen (Alder Lake)
    "12th_gen_core": [
      "1235U", "1240U", "1250U", "1260U", "1270U", "1280U", "1230U", "1215U",
      "1240P", "1250P", "1260P", "1270P", "1280P", "12100H", "12300H", "12450H",
      "12500H", "12600H", "12650H", "12700H", "12800H", "12900H", "12900HK", "12900HX"
    ],

    // Intel Core 13th Gen (Raptor Lake)
    "13th_gen_core": [
      "1305U", "1315U", "1335U", "1345U", "1355U", "1360P", "1370P", "13420H", "13500H",
      "13600H", "13620H", "13650HX", "13700H", "13900H", "13900HX", "13980HX"
    ],

    // Intel Core 14th Gen (Meteor Lake)
    "14th_gen_core": [
      "14400", "14500", "14600", "14600K", "14700", "14700K", "14900", "14900K", "14900KF", "14900KS", "14900F", "14900KF", "14900KS", "14900F", "14900K", "14900KF", "14900KS", "14900F", "14900K", "14900KF", "14900KS", "14900F",
    ],

    // Intel Core Ultra (Meteor Lake)
    "core_ultra": [
      "155H", "165H", "165U", "175H", "185H", "9185H", "9185HL", "7155H", "7155U",
      "7165H", "7165U", "7205H", "5125U", "5135H", "5135U", "5145H", "5145U", "5155H", "5155U",
      "5165H", "5165U", "5175H", "5175U", "5185H", "5185U", "125U", "135U", "145U", "155U", "165U", "175U", "185U",
      "195U", "205U", "215U", "225U", "235U", "245U", "255U", "265U", "275U", "285U"
    ],

    // Intel N-Series
    "n_series": [
      "N95", "N100", "N200", "N300", "N305", "N5100", "N4500", "N4505", "N6000", "N6005", "N6400", "N6405", "N6425", "N6500", "N6505", "N6600", "N6605", "N6700", "N6705",
      "N7100", "N7105", "N7200", "N7205", "N7300", "N7305", "N7400", "N7405", "N7500", "N7505",
    ],

    // Pentium & Celeron
    "pentium_celeron": [
      "6805", "7505", "8505", "G6405", "G7400", "N4020", "N4120", "N5100", "N5105",
      "N6000", "N6005", "J6426", "G6900", "7305", "N100", "N200", "N305", "N5100", "N6000", "N3350"
    ],

    // AMD Ryzen 3000 Series
    "ryzen_3000": [
      "3200U", "3300U", "3450U", "3500U", "3550H", "3580U", "3700U", "3750H", "3780U"
    ],

    // AMD Ryzen 4000 Series
    "ryzen_4000": [
      "4300U", "4450U", "4500U", "4600H", "4600U", "4700U", "4800H", "4800U", "4900H", "4900HS"
    ],

    // AMD Ryzen 5000 Series
    "ryzen_5000": [
      "5300U", "5400U", "5500U", "5600H", "5600HS", "5600U", "5700U", "5800H",
      "5800HS", "5800U", "5900HS", "5900HX", "5980HS", "5980HX"
    ],

    // AMD Ryzen 6000 Series
    "ryzen_6000": [
      "6300U", "6600U", "6800U", "6600H", "6600HS", "6800H", "6800HS", "6900HS", "6900HX"
    ],

    // AMD Ryzen 7000 Series
    "ryzen_7000": [
      "7320U", "7330U", "7520U", "7530U", "7535U", "7640U", "7640HS", "7735U",
      "7735HS", "7840U", "7840HS", "7840H", "7940H", "7940HS", "7945HX"
    ],

    // AMD Ryzen 8000 Series
    "ryzen_8000": [
      "8300G", "8400G", "8500G", "8600G", "8700G", "8800G", "8300U", "8500U",
      "8700U", "8840U", "8940H", "8945HS", "8945HX"
    ],

    "ryzen_ai": [
      "365", "370", "375", "HX 370", "HX 375"
    ],

    // AMD Athlon
    "athlon": [
      "3000G", "3050U", "3150U", "3020E", "Silver 3050e", "Gold 3150U", "Gold 3150G",
      "7020U", "7120U", "7220U", "Silver 7120U", "Gold 7220U", "3045B", "PRO 3045B",
      "PRO 3050U", "PRO 3150U", "PRO 3150G", "PRO 7220U", "PRO 7120U", "PRO 7020U",
      "PRO 3045U", "PRO 3050U", "PRO 3150U", "PRO 3150G", "PRO 7220U", "PRO 7120U", "PRO 7020U"

    ],

    // Qualcomm Snapdragon
    "snapdragon": [
      "7c", "8c", "8cx", "8cx Gen 2", "8cx Gen 3", "X Elite", "X Plus", "8cx Gen 3"
    ],

    // MediaTek
    "mediatek": [
      "Kompanio 500", "Kompanio 520", "Kompanio 528", "Kompanio 820", "Kompanio 828",
      "Kompanio 1200", "Kompanio 1380", "MT8183", "MT8192", "MT8195"
    ],

    // Apple Silicon
    "apple": [
      "M1", "M1 Pro", "M1 Max", "M1 Ultra", "M2", "M2 Pro", "M2 Max", "M2 Ultra",
      "M3", "M3 Pro", "M3 Max", "M3 Ultra", "M4", "M4 Pro", "M4 Max"
    ],

  };
}


function extractRamFromName(name) {
  const lower = norm(name);
  const match = lower.match(/(8|16|32|\d{4}mb)/);
  return match ? match[0] : '';
}

function extractRam(name) {
  const lower = norm(name);
  const match = lower.match(/(4|8|16|32|\d{4}mb)/);
  return match ? match[0] : '';
}
function extractStorage(name) {
  const lower = norm(name);
  const match = lower.match(/(\d{3,4}gb|\d{2}tb)/);
  return match ? match[0] : '';
}

function extractGpu(name) {
  const lower = norm(name);
  //For non Intel
  const match = lower.match(/(gtx|rtx|radeon|amd|qualcomm|mediatek|apple)/);
  if(match){
    if(match[0].includes('radeon')) {
      return 'amd'; // AMD Radeon
    }
    if(match[0].includes('amd')) {
      return 'amd'; // AMD
    }
    return match[0]; // Return the matched GPU type
  }
  // For Intel
  const imatch = lower.match(/(intel)/);
  if (imatch) return imatch[0];
  return '';
}

function extractTouchScreen(name) {
  const lower = norm(name);
  const match = lower.match(/touchscreen|YES|touch\s*display/i);
  return match ? 'YES' : '';
}

function extractRamType(name) {
  const lower = norm(name);
  const match = lower.match(/unified\s*memory|lpddr[45x]|ddr[45]|sdram/i);
  return match ? match[0] : '';
}


function extractProcessorGeneration(name) {
  const lower = norm(name);

  // 0. Intel Core Ultra — match "155H" → generation 15
  // match = lower.match(/core\s+ultra\s+[579]?\s*(\d{3})/);
  // if (match) return match[1][0] + match[1][1]; // e.g., "155" → "15"

  // 1. Match “11th gen”, “12th generation” etc.
  let match = lower.match(/(\d+)(?:st|nd|rd|th)?\s*(?:gen(?:eration)?)/);
  if (match) return match[1];

  // 2. Intel i5-1135G7 → generation from model number
  match = lower.match(/i[3579][\s-]*([0-9]{2})[0-9]{2}[a-z]?/);
  if (match) return match[1];

  // 3. Ryzen 5 5500U → get first digit of model
  match = lower.match(/ryzen\s*[3579]\s*([0-9]{4})/);
  if (match) return match[1][0]; // e.g., '5' from '5500'

  // 4. Apple M1/M2/M3
  match = lower.match(/apple\s*m([123])/);
  if (match) return `M${match[1]}`;

  // 5. Apple A-series
  match = lower.match(/apple\s*a(\d+)/);
  if (match) return `A${match[1]}`;

  // 6. Snapdragon/Exynos/MediaTek version
  match = lower.match(/(snapdragon|exynos|mt|mediatek)[\s\-]*(\d+)/);
  if (match) return match[2];

  // 7. ARM Cortex variant
  match = lower.match(/arm\s*cortex[-\s]*([a-z\d]+)/);
  if (match) return match[1];

  match = lower.match(/core\s+ultra\s+[579].*?series\s+(\d+)/i);
  if (match) return match[1];






  return '';
}



function extractProcessorGenFromProductName(productName, title = '') {
  if (!productName) return null;

  const variant = extractProcessorVariant(productName);
  if (!variant) return null;

  const normalized = variant.toLowerCase().trim();

  // AMD Ryzen pattern (7320U should return "7" not "73")
  if (/^\d\d\d\d[a-z]*$/.test(normalized)) {
    return normalized.charAt(0); // Just take the first character
  }

  // Intel Core pattern (11th gen, 12th gen, etc.)
  let match = normalized.match(/^(\d{1,2})\d{2,3}[a-z]*$/);
  if (match) return match[1];

  // Intel N-series
  match = normalized.match(/^n(\d)\d{2}$/);
  if (match) return `N${match[1]}`;

  if (normalized.match(/^7\d{3}$/)) {
    return "7"; // Or simply "7" for the series number
  }

  // For Core Ultra, extract generation from first digit of model
  if (/^\d{3}[a-z]*$/.test(normalized) && title.toLowerCase().includes('core ultra')) {
    return normalized.charAt(0);
  }

  // For Celeron N-series
  if (/^n\d{4}$/i.test(normalized)) {
    return "N" + normalized.charAt(1);
  }

  if (/^\d{3}[a-z]*$/.test(normalized) && title.toLowerCase().includes('core ultra')) {
    return normalized.charAt(0);
  }

  // For Ryzen AI series
  if (/^\d{3}$/.test(normalized) &&
    (productName.toLowerCase().includes('ryzen ai') ||
      title.toLowerCase().includes('ryzen ai'))) {
    return normalized.charAt(0);  // Returns "3" from "365"
  }

  if (/^r\d/i.test(normalized)) {
    return normalized.charAt(1);  // Returns "1" from "R1"
  }

  if (/^\d{3}[a-z]*$/.test(normalized)) {
    return "1";
  }


  return '';


}
function extractProcessorGenFromLink(name){
  const lower = norm(name);
  // Match "11th gen", "12th generation" etc.
  const match = lower.match(/(10th|11th|12th|13th|14th)/);
  return match ? match[1].replace('th', '') : ''; // e.g., "11th" → "11"
}
function extractNvidiaGpuVersion(name) {
  const lower = norm(name);

  // Match RTX / GTX / MX graphics models with optional "Ti" / "Super"
  const match = lower.match(/(?:rtx|gtx|mx)\s*(\d{3,4})(\s*ti|\s*super)?/i);

  if (match) {
    let version = match[1];
    // if (match[2]) {
    //   version += match[2].trim(); // Add 'ti' or 'super' if present
    // }
    return version;
  }

  return '';
}
function extractGpuVersion(name) {
  const lower = norm(name);
  // Match rtx gtx
  const match = lower.match(/(4050|4060|4070|4080|4090|3060|3070|3080|3090|3500|2060|2070|2080|1650|1660|1050|1060|1070|1080|a500)/);
  if (match) {
    return match[0]; // Return the matched GPU version
  }
  return '';
}

function extractStorageNumber(input) {
  // Normalize to array of lines
  const lines = typeof input === 'string' ? [input] 
               : Array.isArray(input)      ? input 
               : [];

  // 1️⃣ Look for 128/256/512 GB first
  for (const line of lines) {
    const gbMatch = line.match(/\b(128|256|512)\s*GB\b/i);
    if (gbMatch) {
      return gbMatch[1];  // "128", "256" or "512"
    }
  }

  // 2️⃣ Next, look for 1 TB and 2 TB
  for (const line of lines) {
    const tbMatch = line.match(/\b1|2\s*TB\b/i);
    if (tbMatch) {
      return "1";
    }
  }

  // 3️⃣ Nothing matched
  return "";
}
// --- Normalizers ---
function normalizeFlipkart(f) {
  const t = f.technicalDetails || {};
  const hasSSD = (t.SSD || '').toLowerCase() === 'yes';
  const storageSize = hasSSD
    ? stripUnits(t['SSD Capacity'])
    : stripUnits(t['EMMC Storage Capacity']);
  const storageType = hasSSD ? 'ssd' : norm(t['Storage Type']);
  const dispMatch = (t['Screen Size'] || '').match(/\(([\d.]+)\s*inch\)/i);

  return {
    head : f.productName || "",
    brand: extractModel(f.productName),
    series: extractSeries(f.technicalDetails.Series) || extractSeries(f.productName),
    processor: {
      name: extractProcessor(f.technicalDetails["Processor Name"]) || extractProcessor(f.productName),
      gen: extractProcessorGeneration(f.technicalDetails["Processor Generation"]) || extractProcessorGenFromLink(f.productLink) ||
      extractProcessorGenFromProductName(f.productName),
      variant: extractProcessorVariant(f.technicalDetails["Processor Variant"]) || extractProcessorVariant(f.productName)
    },
    details: f.technicalDetails || {},
    ram: {
      size: extractRam(f.technicalDetails.RAM) || extractRam(f.productName),
      type: norm(f.technicalDetails["RAM Type"])
    },
    storage: {
      size: storageSize || extractStorage(f.technicalDetails.Storage) || extractStorageNumber(f.productName),
      type: storageType
    },
    touch: extractTouchScreen(f.productName) || extractTouchScreen(f.technicalDetails.Touchscreen),
    displayInch: dispMatch ? parseFloat(dispMatch[1]) : null,
   gpu:         extractGpu(f.technicalDetails["Graphic Processor"]) || extractGpu(f.productName),
    gpuversion:  extractNvidiaGpuVersion(f.technicalDetails["Graphic Processor"]) || extractNvidiaGpuVersion(f.productName) 
                || extractGpuVersion(f.productName)  || extractGpuVersion(f.technicalDetails["Graphic Processor"]),
    
    price: Number((f.price || '').replace(/[^0-9]/g, '')),  // stored but not matched on
    link: f.productLink || f.cleanProductLink,
    rating: Number(f.rating || 0),
    ratingCount: f.ratingsNumber || 0
  };
}

function normalizeAmazon(a) {
  const d = a.details || {};
  const storageSize = stripUnits(d['Hard Drive Size']);
  const storageType = norm(d['Hard Disk Description']);
  const disp = stripUnits(d['Standing screen display size']);
  const title = a.title || '';

  return {
    head : a.title || "",
    brand: extractModel(title),
    series: extractSeries(title),
    processor: {
      name: extractProcessor(a.details["Processor Type"]) || extractProcessor(title),
      gen: extractProcessorGeneration(title) || extractProcessorGenFromProductName(title, title) || extractProcessorGenFromProductName((a.details.Features || []).join(' ')) || extractProcessorGenFromProductName(d.Description || '') || extractProcessorGenFromProductName(a.details["Processor Type"]) || extractProcessorGenFromProductName(a.details["Processor model number"]),
      variant: extractProcessorVariant(title) || extractProcessorVariant((a.details.Features || []).join(' ')) || extractProcessorVariant(a.details.Description || '') || extractProcessorVariant(a.details["Processor Type"]) || extractProcessorVariant(a.details["Processor model number"])
    },
    details: a.details || {},
    ram: {
      size: extractRam(d["RAM Size"]) || extractRamFromName(title) || extractRamFromName((a.details.Features || []).join(' ')),
      type: norm(a.details["Memory Technology"]) || extractRamType(title) ||  extractRamType((a.details.Features || []).join(' ')) || extractRamType(a.details["Computer Memory Type"]) ,
    },
    storage: {
      size: storageSize || extractStorage(d['Hard Drive Size']) || extractStorageNumber(title) || extractStorageNumber((a.details.Features || []).join(' ')) || extractStorageNumber(d.Description) || extractStorageNumber(a.details["Hard Disk Description"]),
      type: storageType
    },
    touch: extractTouchScreen(title) || extractTouchScreen(d['Touchscreen']),
    displayInch: parseFloat(disp) || null,
    gpu:         extractGpu(a.details['Graphics Coprocessor']) || extractGpu(title) || extractGpu(d['Graphics Chipset Brand']),
    gpuversion:  extractNvidiaGpuVersion(a.details['Graphics Coprocessor']) || extractNvidiaGpuVersion(title) 
                  || extractGpuVersion(title) || extractGpuVersion(d['Graphics Coprocessor']),
    
    price: Number((a.price || '').replace(/[^0-9]/g, '')),
    link: a.url,
    rating: Number(a.rating || 0),
    ratingCount: a.ratingsNumber || 0
  };
}

// --- Matching Key ---
function makeKey(lap) {
  return [
    lap.brand,
    lap.series,
    lap.processor.name,
    lap.processor.gen,
    lap.processor.variant,
    lap.ram.size,
    lap.storage.size,
    // lap.storage.type,
    // lap.Touchscreen,
    lap.gpu,
    lap.gpuversion

  ].join('|');
}
// --- Build & Split Entries ---
function buildEntries(amz, fk) {
  // 1) build Flipkart buckets
  const fkMap = new Map();
  fk.forEach(item => {
    const normF = normalizeFlipkart(item);
    const key = makeKey(normF);
    if (!fkMap.has(key)) fkMap.set(key, []);
    fkMap.get(key).push({ ...normF, _matched: false });
  });

  // prepare arrays
  const matched = [];
  const amazonOnly = [];
  const flipkartOnly = [];

  // 2) match Amazon → Flipkart[]
  amz.forEach(item => {
    const normA = normalizeAmazon(item);
    const key = makeKey(normA);
    const bucket = fkMap.get(key) || [];

    if (bucket.length) {
      // one entry per Flipkart match
      bucket.forEach(fkRec => {
        fkRec._matched = true;
        matched.push({
          brand: normA.brand,
          series: normA.series,
          specs: { ...normA, price: undefined, link: undefined, rating: undefined },
          sites: [
            { source: 'amazon', price: normA.price, link: normA.link, rating: normA.rating , ratingCount: normA.ratingCount },
            { source: 'flipkart', price: fkRec.price, link: fkRec.link, rating: fkRec.rating, ratingCount: fkRec.ratingCount }
          ]
        });
      });
    } else {
      // no match → amazon-only
      amazonOnly.push({
        brand: normA.brand,
        series: normA.series,
        specs: { ...normA, price: undefined, link: undefined, rating: undefined },
        sites: [{ source: 'amazon', price: normA.price, link: normA.link, rating: normA.rating, ratingCount: normA.ratingCount }]
      });
    }
  });

  // 3) collect any Flipkart-only
  fkMap.forEach(bucket => {
    bucket.forEach(fkRec => {
      if (!fkRec._matched) {
        flipkartOnly.push({
          brand: fkRec.brand,
          series: fkRec.series,
          specs: { ...fkRec, price: undefined, link: undefined, rating: undefined },
          sites: [{ source: 'flipkart', price: fkRec.price, link: fkRec.link, rating: fkRec.rating, ratingCount: fkRec.ratingCount }]
        });
      }
    });
  });

  return { matched, amazonOnly, flipkartOnly };
}

// --- Main ---
(function () {
  // load data
  const amazonPath = path.join(__dirname, 'amazon_complete_final.json');
  const flipkartPath = path.join(__dirname, './Flipkart/allLaptops.json');
  const amazonData = JSON.parse(fs.readFileSync(amazonPath, 'utf-8'));
  const flipkartData = JSON.parse(fs.readFileSync(flipkartPath, 'utf-8'));

  // build
  const { matched, amazonOnly, flipkartOnly } = buildEntries(amazonData, flipkartData);
  const finalAll = matched.concat(amazonOnly, flipkartOnly);

  // write files
  fs.writeFileSync('matched_laptops.json', JSON.stringify(matched, null, 2), 'utf-8');
  fs.writeFileSync('amazon_only_laptops.json', JSON.stringify(amazonOnly, null, 2), 'utf-8');
  fs.writeFileSync('flipkart_only_laptops.json', JSON.stringify(flipkartOnly, null, 2), 'utf-8');
  fs.writeFileSync('final_laptops.json', JSON.stringify(finalAll, null, 2), 'utf-8');

  // log stats
  console.log(`✅ Matched: ${matched.length}`);
  console.log(`❌ Amazon-only: ${amazonOnly.length}`);
  console.log(`❌ Flipkart-only: ${flipkartOnly.length}`);
  console.log(`📦 Total entries: ${finalAll.length}`);
})();
