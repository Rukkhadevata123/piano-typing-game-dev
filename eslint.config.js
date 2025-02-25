import globals from 'globals';
import pluginJs from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['src/js/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      prettier: prettier,
    },
  },
  pluginJs.configs.recommended,
  prettierConfig,
  {
    rules: {
      semi: ['error', 'always'],
      indent: ['error', 2],
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'prettier/prettier': 'error',
    },
  },
];
