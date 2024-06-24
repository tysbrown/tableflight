/// <reference types='vitest' />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import macrosPlugin from 'vite-plugin-babel-macros'

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/ui',

  server: {
    proxy: {
      '/refresh_token': {
        target: process.env.VITE_REFRESH_TOKEN_URL || 'http://localhost:1337/refresh_token',
      },
      '/graphql': {
        target: process.env.VITE_API_URL || 'http://localhost:1337/graphql',
      },
    },
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [
    react({
      babel: {
        plugins: [
          'babel-plugin-macros',
          [
            '@emotion/babel-plugin-jsx-pragmatic',
            {
              export: 'jsx',
              import: '__cssprop',
              module: '@emotion/react',
            },
          ],
          [
            '@babel/plugin-transform-react-jsx',
            { pragma: '__cssprop' },
            'twin.macro',
          ],
        ],
      },
    }),
    macrosPlugin(),
    nxViteTsPaths(),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  build: {
    outDir: '../../dist/apps/ui',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  test: {
    watch: false,
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest/apps/ui',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/ui',
      provider: 'v8',
    },
  },
})
