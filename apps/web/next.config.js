// next.config.js
const { composePlugins, withNx } = require('@nx/next');
const path = require('path');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  output: 'standalone',
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

/**
 * Wraps withNx to gracefully handle CI environments where the Nx project
 * graph inside the forked next build process may not resolve the build target.
 */
function safeWithNx(config) {
  const nxPlugin = withNx(config);
  return async (phase) => {
    try {
      return await nxPlugin(phase);
    } catch (err) {
      console.warn(
        `[next.config.js] withNx failed (${err.message}), using fallback config.`
      );
      const { nx, ...validConfig } = config;
      const outputPath = process.env.NX_NEXT_OUTPUT_PATH;
      if (outputPath) {
        const projectDir = process.cwd();
        const workspaceRoot = path.resolve(projectDir, '../..');
        const absOutput = path.resolve(workspaceRoot, outputPath);
        validConfig.distDir = path.join(
          path.relative(projectDir, absOutput),
          '.next'
        );
      }
      return { distDir: '.next', ...validConfig };
    }
  };
}

const plugins = [safeWithNx];

module.exports = composePlugins(...plugins)(nextConfig);
