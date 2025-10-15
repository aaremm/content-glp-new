/**
 * Content Scale - Asset Management
 * 
 * This module provides utilities for managing and accessing
 * organized content assets across different content types.
 */

// Asset path constants
export const ASSET_PATHS = {
  blog: '/content-scale/assets/blog',
  reels: '/content-scale/assets/reels',
  stories: '/content-scale/assets/stories',
  articles: '/content-scale/assets/articles',
  global: '/content-scale/assets/global',
};

// Asset specifications
export const ASSET_SPECS = {
  blog: {
    formats: ['jpg', 'png', 'webp'],
    dimensions: { min: { width: 800, height: 500 } },
    aspectRatio: '16:10',
    maxSize: 500 * 1024, // 500KB
  },
  reels: {
    formats: ['mp4', 'mov', 'jpg', 'png'],
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    maxSize: 30 * 1024 * 1024, // 30MB for video
  },
  stories: {
    formats: ['jpg', 'png', 'mp4'],
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    maxSize: 4 * 1024 * 1024, // 4MB
  },
  articles: {
    formats: ['jpg', 'png', 'webp'],
    dimensions: { min: { width: 1200, height: 630 } },
    aspectRatio: '16:9',
    maxSize: 1024 * 1024, // 1MB
  },
  global: {
    formats: ['svg', 'png', 'jpg'],
    dimensions: { flexible: true },
    maxSize: 200 * 1024, // 200KB
  },
};

/**
 * Get asset path for a specific content type
 * @param {string} contentType - The type of content (blog, reels, stories, articles, global)
 * @returns {string} The asset path
 */
export function getAssetPath(contentType) {
  return ASSET_PATHS[contentType] || ASSET_PATHS.global;
}

/**
 * Get asset specifications for a content type
 * @param {string} contentType - The type of content
 * @returns {object} Asset specifications
 */
export function getAssetSpecs(contentType) {
  return ASSET_SPECS[contentType] || ASSET_SPECS.global;
}

/**
 * Validate asset file size
 * @param {number} fileSize - Size in bytes
 * @param {string} contentType - Content type
 * @returns {boolean} Whether the file size is valid
 */
export function validateFileSize(fileSize, contentType) {
  const specs = getAssetSpecs(contentType);
  return fileSize <= specs.maxSize;
}

/**
 * Validate asset format
 * @param {string} fileName - The file name
 * @param {string} contentType - Content type
 * @returns {boolean} Whether the format is valid
 */
export function validateFormat(fileName, contentType) {
  const specs = getAssetSpecs(contentType);
  const extension = fileName.split('.').pop()?.toLowerCase();
  return specs.formats.includes(extension);
}

export default {
  ASSET_PATHS,
  ASSET_SPECS,
  getAssetPath,
  getAssetSpecs,
  validateFileSize,
  validateFormat,
};





