import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  file: Buffer,
  options: {
    folder: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'auto' | 'raw';
  }
) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder,
      public_id: options.public_id,
      resource_type: options.resource_type || 'auto' as const,
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }).end(file);
  });
}

// Helper function to get file extension based on resource type
function getExtensionFromResourceType(resourceType?: 'image' | 'video' | 'auto' | 'raw'): string {
  switch(resourceType) {
    case 'image': return '.jpg';
    case 'video': return '.mp4';
    case 'raw': return '';
    case 'auto':
    default: return '';
  }
}

export async function uploadFromUrl(
  url: string,
  options: {
    folder: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'auto' | 'raw';
  }
) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder,
      public_id: options.public_id,
      resource_type: options.resource_type || 'auto' as const,
    };

    cloudinary.uploader.upload(url, uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

export default cloudinary;
