/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Define global for browser
      config.plugins.push(
        new (require('webpack')).ProvidePlugin({
          global: 'global',
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;