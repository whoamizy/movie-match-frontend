import unocss from '@unocss/eslint-config/flat'
import prettierPlugin from 'eslint-plugin-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['.agents/**'],
  },
  unocss,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['error'] }],

      'no-unused-vars': 'error',
      '@typescript-eslint/no-unused-vars': 'error',

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
    },
  },
)
