import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import nextPlugin from '@next/eslint-plugin-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/coverage/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettier,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        React: true,
        JSX: true,
        NodeJS: true,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React and Next.js rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@next/next/no-html-link-for-pages': 'off',

      // General rules
      'no-console': 'warn',
      'no-unused-vars': 'off', // Turned off in favor of @typescript-eslint/no-unused-vars
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],

      // Environment specific
      'no-undef': 'off', // TypeScript handles this
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },
];
