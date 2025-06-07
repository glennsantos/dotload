/** @type {import('next').NextConfig} */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const fs = require('fs');
const path = require('path');

const nextConfig = {
  // Ensure static files are properly served
  devIndicators: false,
  output: 'standalone',
  images: {
    unoptimized: true, // Disable image optimization if not needed
  },
  logging: {
    level: 'verbose'
  },
  // The 'api' config is no longer supported in newer Next.js versions
  // Moving relevant settings to serverRuntimeConfig
  serverRuntimeConfig: {
    // Server-side only config
    bodySizeLimit: '100mb',
    responseLimit: false,
  },
  publicRuntimeConfig: {
    // Config accessible on both server and client
  },
  images: {
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
  webpack: (config, { isServer, dev }) => {
    // Enable console logging on the server
    if (isServer) {
      config.optimization.minimize = false;
    }

    // Add CSS handling for production build
    if (!isServer && !dev) {
      // Find the default CSS loader
      const cssRuleIndex = config.module.rules.findIndex(
        (rule) => {
          if (!rule || typeof rule !== 'object' || !rule.test) return false;
          
          // Handle both string and RegExp test patterns
          if (typeof rule.test === 'string') {
            return rule.test.includes('css');
          } else if (rule.test instanceof RegExp) {
            return rule.test.test('.css');
          }
          return false;
        }
      );

      if (cssRuleIndex !== -1) {
        // Remove the default CSS loader
        config.module.rules.splice(cssRuleIndex, 1);

        // Add our custom CSS loader with MiniCssExtractPlugin
        config.module.rules.push({
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        });

        // Add MiniCssExtractPlugin
        config.plugins.push(
          new MiniCssExtractPlugin({
            filename: 'static/css/[name].[contenthash].css',
            chunkFilename: 'static/css/[id].[contenthash].css',
          })
        );
      }
    }


    return config;
  }
};

module.exports = nextConfig;
