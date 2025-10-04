/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  generateEtags: true,
  
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['bcrypt'],
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'usdozf7pplhxfvrl.public.blob.vercel-storage.com',
      'api.dicebear.com',
      'avatars.githubusercontent.com',
      'storage.carromarena.com',
      'cdn.carromarena.com',
      'assets.carromarena.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https', 
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '**.carromarena.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      }
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://js.sentry-cdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self';",
          }
        ],
      },
      {
        source: '/.well-known/farcaster.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          }
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          }
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      }
    ]
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle Phaser for client-side only
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },
  // Output configuration for deployment
  output: 'standalone',
  
  // Optimization
  swcMinify: true,
  
  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/game',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // API configuration
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '8mb',
    },
    externalResolver: true,
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  // Additional optimizations
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
      preventFullImport: true,
    },
  },
  
  // TypeScript configuration
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src', 'pages', 'components', 'lib', 'utils'],
  },
};

// Export configuration with optional Sentry and Bundle Analyzer
let config = nextConfig;

// Add bundle analyzer in development
if (process.env.ANALYZE === 'true') {
  config = withBundleAnalyzer(config);
}

// Add Sentry configuration in production
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  config = withSentryConfig(
    config,
    {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    },
    {
      widenClientFileUpload: true,
      transpileClientSDK: true,
      tunnelRoute: '/monitoring',
      hideSourceMaps: true,
      disableLogger: true,
    }
  );
}

module.exports = config;