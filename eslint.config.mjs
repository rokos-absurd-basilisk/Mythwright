import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks':        reactHooksPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.app.json', ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars':    ['error', { argsIgnorePattern:'^_', varsIgnorePattern:'^_' }],
      '@typescript-eslint/no-explicit-any':   'warn',
      // React Hooks
      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': 'warn',
      // General
      'no-console':   ['warn', { allow:['warn','error'] }],
      'no-debugger':  'error',
      'no-unused-vars': 'off',  // replaced by @typescript-eslint version
    },
  },
  {
    // Relax for test files
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.*'],
  },
]
