/**
 * Domain utility functions for file upload organization
 */

/**
 * Convert domain name to a storage-safe slug
 * Examples: 
 * - "Jazz Music" -> "jazz-music"
 * - "GMAT" -> "gmat" 
 * - "Classical Music" -> "classical-music"
 */
export const slugifyDomainName = (domainName: string): string => {
  return domainName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate the full GCS storage path for a file
 */
export const generateStoragePath = (domainSlug: string, fileName: string): string => {
  return `${domainSlug}/${fileName}`;
};

/**
 * Validate file type and size
 */
export const validateFile = (file: File, maxSizeMB: number = 50): { isValid: boolean; error?: string } => {
  // Check file size (default 50MB limit)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  // Check if file has a name
  if (!file.name) {
    return {
      isValid: false,
      error: 'File must have a name'
    };
  }

  // Basic file type validation (could be expanded)
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/avi'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not supported'
    };
  }

  return { isValid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};