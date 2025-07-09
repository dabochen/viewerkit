module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  extends: [
    'airbnb-typescript/base',
    '@typescript-eslint/recommended',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  env: {
    node: true,
    es2020: true,
  },
  rules: {
    // ViewerKit specific rules
    'import/prefer-default-export': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    'import/no-cycle': 'error',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.config.js',
    '*.config.ts',
  ],
}; 