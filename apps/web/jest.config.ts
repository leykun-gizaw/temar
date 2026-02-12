import type { Config } from 'jest';

const config: Config = {
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
    '^better-auth/react$': '<rootDir>/specs/__mocks__/better-auth-react.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@temar/db-client$': '<rootDir>/../../libs/db-client/src/index.ts',
    '^@temar/shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/web',
  testEnvironment: 'jsdom',
};

export default config;
