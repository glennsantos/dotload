/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    level: 'verbose'
  },
  images: {
    domains: [
      'res.cloudinary.com',
      'via.placeholder.com',
      'placehold.co',
      'placekitten.com',
      'picsum.photos',
      'loremflickr.com',
      'dummyimage.com',
      'placeholder.pics',
      'images.unsplash.com'
    ],
  },
  webpack: (config, { isServer }) => {
    // Enable console logging on the server
    if (isServer) {
      config.optimization.minimize = false;
    }
    return config;
  }
};

module.exports = nextConfig;
