// Utility functions for storage formatting
// Matches the logic used in the backend's advanced search

export const formatStorageSize = (size: number | string | undefined): string => {
  if (!size) return "";
  
  const numericSize = typeof size === 'string' ? parseInt(size) : size;
  if (isNaN(numericSize) || numericSize <= 0) return "";

  // Logic matching backend: if value < 10, treat as TB; otherwise as GB
  if (numericSize < 10) {
    // This is a TB value stored as single digit (1 = 1TB, 2 = 2TB)
    return `${numericSize}TB`;
  } else if (numericSize >= 1000) {
    // Large GB values - convert to TB for display
    const tbValue = numericSize / 1000;
    return `${tbValue % 1 === 0 ? tbValue.toFixed(0) : tbValue.toFixed(1)}TB`;
  } else {
    // GB values
    return `${numericSize}GB`;
  }
};

export const formatStorage = (storage: { size?: number | string; type?: string } | undefined): string => {
  if (!storage) return "";
  
  const sizeText = formatStorageSize(storage.size);
  const typeText = storage.type ? ` ${storage.type.toUpperCase()}` : "";
  
  return `${sizeText}${typeText}`.trim();
};

export const formatStorageForDisplay = (laptop: any): string => {
  if (!laptop?.specs?.storage) return "";
  
  return formatStorage(laptop.specs.storage);
};
