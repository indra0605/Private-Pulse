import { createRequire } from 'node:module';
import type { NextConfig } from 'next';
const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      path: false,
      net: false,
      tls: false,
      child_process: false,
    };

    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      'isomorphic-ws': require.resolve('./lib/isomorphic-ws-fix.mjs'),
    };

    config.experiments = {
      ...(config.experiments ?? {}),
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    return config;
  },
};

export default nextConfig;
