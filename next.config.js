/** @type {import('next').NextConfig} */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
      const cssRule = config.module.rules.find(
        (rule) => rule.test && rule.test.test('.css')
      );

      if (cssRule) {
        // Remove the default CSS loader
        config.module.rules = config.module.rules.filter(
          (rule) => rule !== cssRule
        );

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
