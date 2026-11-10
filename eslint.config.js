import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

const noFloatMoney = {
  'no-restricted-globals': [
    'error',
    { name: 'parseFloat', message: 'Money must stay exact: use Rational.' },
    { name: 'parseInt', message: 'Money must stay exact: use Rational.' },
    { name: 'Math', message: 'Money must stay exact: no floating-point Math in the engine.' },
    { name: 'Number', message: 'Money must stay exact: no Number conversions in the engine.' },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: 'MemberExpression[property.name=/^(toFixed|toPrecision|toExponential)$/]',
      message: 'Money must stay exact: no float formatting in the engine.',
    },
    {
      selector: 'Literal[raw=/^[0-9]*\\.[0-9]+$/]',
      message: 'No fractional number literals in the engine: use Rational.',
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '.venv/**',
      '**/dist/**',
      '**/.astro/**',
      'data/**',
      'ml/**',
      'docs/**',
      'playwright-report/**',
      'test-results/**',
      'apps/site/**/*.astro',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['packages/engine/src/**/*.ts'],
    rules: noFloatMoney,
  },
  {
    files: ['apps/app/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'three', message: 'The app stays calm: no 3D (showcase only).' },
            { name: 'gsap', message: 'The app stays calm: no GSAP (showcase only).' },
          ],
          patterns: [
            {
              group: ['three/*', 'gsap/*', '@react-three/*'],
              message: 'No 3D or GSAP in the app.',
            },
          ],
        },
      ],
    },
  },
);
