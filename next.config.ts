import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开启生产环境的 sourceMap（用于错误追踪和调试）
  // productionBrowserSourceMaps: true,

  // Webpack 配置：确保开发和生产环境都生成 sourceMap
  webpack: (config, { dev }) => {
    // 开发环境默认开启 sourceMap，这里确保开启
    if (dev) {
      config.devtool = 'eval-source-map';
    } else {
      // 生产环境：如果需要 sourceMap，使用 'source-map'（会生成独立的 .map 文件）
      // 如果不想生成独立文件，可以使用 'hidden-source-map'
      config.devtool = 'hidden-source-map';
    }

    return config;
  },
  turbopack: {},
  // turbopack: (config) => {
  //   config.resolve.alias = {
  //     ...config.resolve.alias,
  //     '@': path.resolve(__dirname, 'src'),
  //   };
  //   return config;
  // },
};

export default nextConfig;
