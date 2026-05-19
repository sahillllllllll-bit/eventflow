import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  const config = cloudinary.config();
  return !!(config.cloud_name && config.api_key && config.api_secret);
};

// Log configuration status
if (!isCloudinaryConfigured()) {
  console.warn('⚠️  WARNING: Cloudinary is not properly configured. File uploads will fail.');
  console.warn('⚠️  Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
}

// Multer storage for Cloudinary
export const createCloudinaryStorage = (folder = 'eventglow') => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const originalName = file.originalname.split('.')[0].replace(/\s+/g, '-');
      const publicId = `${folder}/${originalName}-${timestamp}-${randomString}`;

      return {
        folder: folder,
        public_id: publicId,
        resource_type: 'auto',
      };
    },
  });
};

// Create multer instance for Cloudinary
export const createCloudinaryUploader = (folder = 'eventglow', maxSize = 5 * 1024 * 1024) => {
  return multer({
    storage: createCloudinaryStorage(folder),
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      // Allowed file types
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ];

      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
      }
    },
  });
};

// Upload buffer to Cloudinary (for server-side generated content like PDFs, certificates)
export const uploadBuffer = async (buffer, filename, folder = 'eventglow') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename.split('.')[0],
        resource_type: 'auto',
        timeout: 60000,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Get Cloudinary uploader for different file types
export const getRegistrationFileUploader = () => createCloudinaryUploader('eventglow/registrations', 5 * 1024 * 1024);
export const getCertificateUploader = () => createCloudinaryUploader('eventglow/certificates', 10 * 1024 * 1024);
export const getProfilePhotoUploader = () => createCloudinaryUploader('eventglow/profiles', 3 * 1024 * 1024);
export const getEventCoverUploader = () => createCloudinaryUploader('eventglow/events/covers', 5 * 1024 * 1024);
export const getCertificateLogoUploader = () => createCloudinaryUploader('eventglow/certificates/logos', 2 * 1024 * 1024);
export const getCertificateSignatureUploader = () => createCloudinaryUploader('eventglow/certificates/signatures', 2 * 1024 * 1024);

export default {
  createCloudinaryStorage,
  createCloudinaryUploader,
  uploadBuffer,
  deleteFromCloudinary,
  getRegistrationFileUploader,
  getCertificateUploader,
  getProfilePhotoUploader,
};
