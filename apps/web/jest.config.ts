const { Config } = require('jest');

const config: typeof Config = {
  displayName: '@temar/web',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': [
      '@swc/jest',
      {
        swcrc: false,
        jsc: {
          target: 'es2022',
          transform: {
            react: { runtime: 'automatic' },
          },
        },
      },
    ],
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/specs/__mocks__/image-stub.ts',
    '^better-auth/react$': '<rootDir>/specs/__mocks__/better-auth-react.ts',
    '^@/components/knowledge-network-wrapper$':
      '<rootDir>/specs/__mocks__/knowledge-network-wrapper.tsx',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@temar/db-client$': '<rootDir>/../../libs/db-client/src/index.ts',
    '^@temar/shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/web',
  testEnvironment: 'jsdom',
};

module.exports = config;
