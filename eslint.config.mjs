import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks':        reactHooksPlugin,
      'react-refresh':      reactRefreshPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: {
        // Browser globals
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
        setInterval: 'readonly', clearInterval: 'readonly',
        fetch: 'readonly', URL: 'readonly', Blob: 'readonly',
        File: 'readonly', FileReader: 'readonly', FormData: 'readonly',
        AbortSignal: 'readonly', crypto: 'readonly', localStorage: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        ResizeObserver: 'readonly', MutationObserver: 'readonly',
        HTMLElement: 'readonly', HTMLDivElement: 'readonly', HTMLAnchorElement: 'readonly',
        HTMLInputElement: 'readonly', HTMLButtonElement: 'readonly',
        SVGElement: 'readonly', SVGSVGElement: 'readonly',
        MouseEvent: 'readonly', KeyboardEvent: 'readonly', InputEvent: 'readonly',
        Event: 'readonly', EventListener: 'readonly',
        DOMRect: 'readonly', DOMRectReadOnly: 'readonly',
        confirm: 'readonly', alert: 'readonly',
        atob: 'readonly', btoa: 'readonly',
        React: 'readonly',
        Node: 'readonly',  // React Flow Node type (imported as FlowNode)
        // React hooks (when imported individually)
        useState: 'readonly', useEffect: 'readonly', useCallback: 'readonly',
        useMemo: 'readonly', useRef: 'readonly', useContext: 'readonly',
        useReducer: 'readonly', useLayoutEffect: 'readonly', useId: 'readonly',
        structuredClone: 'readonly',
        // Node.js globals (for scripts)
        process: 'readonly', __dirname: 'readonly', __filename: 'readonly',
        // Vitest
        describe: 'readonly', it: 'readonly', expect: 'readonly',
        beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly',
        afterAll: 'readonly', vi: 'readonly',
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // React Hooks (v5 — stable rules only)
      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': 'warn',
      // React Refresh (fast-refresh warnings)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // General
      'no-console':    ['warn', { allow: ['warn', 'error'] }],
      'no-debugger':   'error',
      'no-unused-vars': 'off', // @typescript-eslint version handles this
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
    ignores: ['dist/**', 'node_modules/**', 'scripts/**', '*.config.*', 'vitest.config.ts'],
  },
]
