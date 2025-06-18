/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: [
      'res.cloudinary.com',
      'via.placeholder.com',
      'placehold.co',
      'placekitten.com',
      'picsum.photos',
      'fastly.picsum.photos',
      'loremflickr.com',
      'dummyimage.com',
      'placeholder.pics',
      'images.unsplash.com'
    ],
  },
  serverExternalPackages: ['@prisma/client'],
};

module.exports = nextConfig;
