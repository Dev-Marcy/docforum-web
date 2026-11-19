// ESLint flat config — modest on purpose (issue #11): the point is to catch
// React-specific mistakes `tsc` cannot (conditional hooks, missing hook
// dependencies), not to reformat the codebase.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'docforum-core/',
      'packages/api-client/src/generated/',
      'playwright-report/',
      'test-results/',
      '*.tsbuildinfo',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Issues #254/#255: a direct `toLocale*String()` call formats with the
    // machine's locale and system zone, ignoring the language and time zone
    // the user selected. Route every displayed date/time through the shared
    // formatters in `src/i18n` instead.
    //
    // Scoped to the features migrated in #254/#255. A repository-wide rule is
    // deferred until the remaining legacy call sites (see the PR description)
    // are migrated; `src/i18n` is where the implementation itself lives and
    // is never restricted.
    files: [
      'src/features/{doctor-today,referrals,results,patient-chart,medications,care-hub,appointments,verification}/**/*.{ts,tsx}',
      'src/features/{payments,fulfillment,facility-queue,facility-settings,integrations,insights,admin-closures}/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='toLocaleString']",
          message:
            'Use the shared formatters (useFormat/ZonedTime in src/i18n) instead of toLocaleString() so dates follow the selected language and time zone.',
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleDateString']",
          message:
            'Use the shared formatters (useFormat/ZonedTime in src/i18n) instead of toLocaleDateString() so dates follow the selected language and time zone.',
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleTimeString']",
          message:
            'Use the shared formatters (useFormat/ZonedTime in src/i18n) instead of toLocaleTimeString() so times follow the selected language and time zone.',
        },
      ],
    },
  },
  {
    // Test doubles legitimately need `any` (mock event objects, partial
    // Sentry events) and the casts are local to assertions; keeping the
    // rule on for production code is what matters.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    files: ['e2e/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Playwright's fixture API passes a callback named `use` (as in
      // `({ page }, use) => ...`), which the React hook rules misread as
      // React's `use()`. These specs contain no React components at all,
      // so the rule has nothing to check here.
      'react-hooks/rules-of-hooks': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
);
