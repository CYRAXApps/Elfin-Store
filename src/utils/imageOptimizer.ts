/**
 * High-performance image optimization helper.
 * Formats image URLs with responsive sizing, WebP/AVIF auto-negotiation,
 * and quality compression without altering the original asset source.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  fit?: 'crop' | 'clip' | 'max' | 'min';
}

export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageOptimizationOptions = {}
): string | undefined {
  if (!url || typeof url !== 'string' || !url.trim()) return undefined;

  const trimmed = url.trim();

  // Return data URLs and SVG directly
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.endsWith('.svg')) {
    return trimmed;
  }

  const { width, height, quality = 80, format = 'auto', fit = 'crop' } = options;

  try {
    // 1. Unsplash Images Optimization
    if (trimmed.includes('images.unsplash.com')) {
      const urlObj = new URL(trimmed);
      if (width) urlObj.searchParams.set('w', width.toString());
      if (height) urlObj.searchParams.set('h', height.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', fit);
      return urlObj.toString();
    }

    // 2. Cloudinary Images Optimization
    if (trimmed.includes('cloudinary.com') && trimmed.includes('/upload/')) {
      const parts = trimmed.split('/upload/');
      const transformations = [`q_${quality}`, `f_${format}`];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      if (fit === 'crop') transformations.push('c_fill');
      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }

    // 3. Imgix / Fastly style params
    if (trimmed.includes('imgix.net')) {
      const urlObj = new URL(trimmed);
      if (width) urlObj.searchParams.set('w', width.toString());
      if (height) urlObj.searchParams.set('h', height.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('auto', 'format,compress');
      return urlObj.toString();
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Generate standard srcset for responsive image tags
 */
export function getResponsiveSrcSet(url?: string | null, widths: number[] = [320, 480, 640, 768, 1024, 1280]): string {
  if (!url || !url.includes('images.unsplash.com')) return '';

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w, quality: 80 })} ${w}w`)
    .join(', ');
}
