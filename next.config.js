/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    level: 'verbose'
  },
  images: {
    domains: ['res.cloudinary.com'],
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
