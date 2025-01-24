/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        http: false,
        https: false,
        crypto: false,
      };
    }
    return config;
  },
  serverActions: {
    bodySizeLimit: '10mb',
  },
};

module.exports = nextConfig;
