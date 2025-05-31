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
      
      // 未使用变量和函数的警告配置
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',           // 检查所有变量
          args: 'after-used',    // 检查函数参数（在使用后的参数）
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_', // 忽略以 _ 开头的参数
          varsIgnorePattern: '^_', // 忽略以 _ 开头的变量
          caughtErrors: 'all',   // 检查 catch 中的错误变量
          caughtErrorsIgnorePattern: '^_' // 忽略以 _ 开头的错误变量
        }
      ],
      
      // 检查未定义的变量
      'no-undef': 'error',
      
      // 检查未使用的私有类成员（如果你使用私有字段）
      'no-unused-private-class-members': 'warn',
      
      'prettier/prettier': 'error',
    },
  },
];