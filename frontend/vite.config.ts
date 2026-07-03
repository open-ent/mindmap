/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import {
  hashEdificeBootstrap,
  queryHashVersion,
} from './plugins/vite-plugin-edifice';

export default ({ mode }: { mode: string }) => {
  // Checking environement files
  const envFile = loadEnv(mode, process.cwd());
  const envs = { ...process.env, ...envFile };
  const hasEnvFile = Object.keys(envFile).length;

  // Proxy variables
  const headers = hasEnvFile
    ? {
        'set-cookie': [
          `oneSessionId=${envs.VITE_ONE_SESSION_ID}`,
          `XSRF-TOKEN=${envs.VITE_XSRF_TOKEN}`,
        ],
        'Cache-Control': 'public, max-age=300',
      }
    : {};

  const proxyObj = hasEnvFile
    ? {
        target: envs.VITE_RECETTE,
        changeOrigin: true,
        headers: {
          cookie: `oneSessionId=${envs.VITE_ONE_SESSION_ID};authenticated=true; XSRF-TOKEN=${envs.VITE_XSRF_TOKEN}`,
        },
      }
    : {
        target: 'http://localhost:8090',
        changeOrigin: false,
      };

  // Mode « embed » : bundle micro-frontend AUTO-CONTENU (embarque son propre React 18)
  // exposant mount/unmount pour le montage in-layout dans le dashboard (CCTP 51C-2).
  const isEmbed = mode === 'embed';

  /* Replace "/" the name of your application (e.g : blog | mindmap | collaborativewall) */
  return defineConfig({
    base: mode === 'production' ? '/mindmap' : isEmbed ? '/mindmap/public/embed/' : '',
    root: __dirname,
    cacheDir: './node_modules/.vite/mindmap',
    // Le bundle embed embarque React/deps qui lisent `process.env.NODE_ENV` au runtime
    // (sinon `process is not defined` dans le navigateur).
    ...(isEmbed
      ? {
          define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
            'process.env': '{}',
          },
        }
      : {}),

    resolve: {
      alias: {
        '@images': resolve(
          __dirname,
          'node_modules/@open-ent/bootstrap/dist/images',
        ),
      },
      dedupe: [
        'react',
        'react-dom',
        '@tanstack/react-query',
        'react-i18next',
        'i18next',
        '@open-ent/client',
        '@open-ent/react',
        '@open-ent/bootstrap',
        '@open-ent/explorer',
      ],
    },

    server: {
      fs: {
        /**
         * Allow the server to access the node_modules folder (for the images)
         * This is a solution to allow the server to access the images and fonts of the bootstrap package for 1D theme
         */
        allow: ['../../'],
      },
      proxy: {
        '/applications-list': proxyObj,
        '/conf/public': proxyObj,
        '^/(?=help-1d|help-2d)': proxyObj,
        '^/(?=assets)': proxyObj,
        '^/(?=theme|locale|i18n|skin)': proxyObj,
        '^/(?=auth|appregistry|archive|cas|userbook|directory|communication|conversation|portal|session|timeline|workspace|infra)':
          proxyObj,
        '/xiti': proxyObj,
        '/analyticsConf': proxyObj,
        '/explorer': proxyObj,
        '/mindmap': proxyObj,
      },
      port: 4200,
      headers,
      host: 'localhost',
    },

    preview: {
      port: 4300,
      headers,
      host: 'localhost',
    },

    plugins: [
      react(),
      tsconfigPaths(),
      hashEdificeBootstrap({
        hash: queryHashVersion,
      }),
    ],

    build: isEmbed
      ? {
          // Bundle auto-contenu exposant mount/unmount (entrée src/mount.tsx).
          outDir: './embed',
          emptyOutDir: true,
          commonjsOptions: { transformMixedEsModules: true },
          lib: {
            entry: resolve(__dirname, 'src/mount.tsx'),
            name: 'OpenEntMindmapEmbed',
            formats: ['es'],
            fileName: () => 'mindmap.js',
          },
          rollupOptions: {
            output: { inlineDynamicImports: true, entryFileNames: 'mindmap.js' },
          },
        }
      : {
          outDir: './dist',
          emptyOutDir: true,
          reportCompressedSize: true,
          commonjsOptions: {
            transformMixedEsModules: true,
          },
          assetsDir: 'public',
          chunkSizeWarningLimit: 5000,
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        },

    test: {
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: ['./src/mocks/setup.ts'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: './coverage/mindmap',
        provider: 'v8',
      },
      server: {
        deps: {
          inline: ['@open-ent/react'],
        },
      },
    },
  });
};
