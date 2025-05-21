/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    }
  },
  // 이미지 설정 유지
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ads-partners.coupang.com',
        pathname: '/image1/**',
      },
      {
        protocol: 'https',
        hostname: 'growsome.kr',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60,
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },

  // 헤더 설정 유지
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ]
  },

  
  // 빌드 에러 무시 설정 (선택 사항)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // webpack 설정 추가
  webpack: (config, { dev, isServer }) => {
    // 개발 환경이 아니고 서버 빌드가 아닌 경우에만 최적화 적용
    if (!dev && !isServer) {
      // 트리 쉐이킹 활성화
      config.optimization.usedExports = true;
      
      // 번들 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
      
      // 불필요한 코드 제거 활성화
      config.optimization.concatenateModules = true;
    }
    
    return config;
  },
};

export default nextConfig;