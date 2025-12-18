/**
 * Image Compression Utility
 * Compresses images to reduce file size before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  maxSizeMB: 1,
};

/**
 * Compress an image file to reduce its size
 * @param file The image file to compress
 * @param options Compression options
 * @returns Promise with compressed image as base64 string
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          const maxWidth = opts.maxWidth!;
          const maxHeight = opts.maxHeight!;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Use better image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with quality setting
          let quality = opts.quality!;
          let base64 = canvas.toDataURL('image/jpeg', quality);

          // If still too large, reduce quality further
          const maxSizeBytes = (opts.maxSizeMB! * 1024 * 1024 * 4) / 3; // Base64 is ~33% larger
          while (base64.length > maxSizeBytes && quality > 0.1) {
            quality -= 0.1;
            base64 = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get human-readable file size
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate base64 string size in bytes
 * @param base64 Base64 string
 * @returns Size in bytes
 */
export function getBase64Size(base64: string): number {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  // Calculate size (base64 is ~33% larger than original)
  return Math.ceil((base64Data.length * 3) / 4);
}

/**
 * Validate image file
 * @param file File to validate
 * @param maxSizeMB Maximum size in MB
 * @returns Error message or null if valid
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): string | null {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file';
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Image must be less than ${maxSizeMB}MB (current: ${formatFileSize(file.size)})`;
  }

  return null;
}
