let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

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
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for Mapbox GL CSS
    config.module.rules.push({
      test: /mapbox-gl\.css$/,
      use: ['style-loader', 'css-loader'],
    })

    // Add CSS handling for other files
    config.module.rules.push({
      test: /\.css$/,
      exclude: /mapbox-gl\.css$/,
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [
                'postcss-flexbugs-fixes',
                'postcss-preset-env',
                'tailwindcss',
                'autoprefixer',
              ],
            },
          },
        },
      ],
    })

    // Fix for asset/inline issue
    config.module.generator['asset/resource'] = config.module.generator['asset']
    config.module.generator['asset/source'] = config.module.generator['asset']
    delete config.module.generator['asset']

    return config
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
