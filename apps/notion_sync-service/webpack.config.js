const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');

module.exports = {
  context: __dirname,
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      externalDependencies: 'all',
      bundledDependencies: ['@temar/db-client', '@temar/shared-types'],
    }),
  ],
};
