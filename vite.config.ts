import path from 'node:path'
import process from 'node:process'

import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  base: `/`,
  define: { process },
  envPrefix: [`VITE_`, `CF_`],
  server: {
    allowedHosts: [`www.easy-write.com`],
    proxy: {
      '/api/extract': {
        target: `https://api.xingke888.com/extract`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    vue(),
    UnoCSS(),
    nodePolyfills({
      include: [`path`, `util`, `timers`, `stream`, `fs`],
      overrides: {
        // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
        // fs: 'memfs',
      },
    }),
    process.env.ANALYZE === `true`
    && visualizer({ emitFile: true, filename: `stats.html` }),
    AutoImport({
      imports: [`vue`, `pinia`, `@vueuse/core`],
      dirs: [`./src/stores`, `./src/utils/toast`, `./src/composables`],
    }),
    Components({
      resolvers: [],
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, `./src`) },
  },
  css: { devSourcemap: true },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: `static/js/md-[name]-[hash].js`,
        entryFileNames: `static/js/md-[name]-[hash].js`,
        assetFileNames: `static/[ext]/md-[name]-[hash].[ext]`,
        manualChunks(id) {
          if (id.includes(`node_modules`)) {
            // 大型库单独分包，实现懒加载
            if (id.includes(`katex`))
              return `katex`
            if (id.includes(`mermaid`))
              return `mermaid`
            if (id.includes(`cytoscape`))
              return `cytoscape`
            if (id.includes(`highlight.js`))
              return `hljs`
            if (id.includes(`prettier`))
              return `prettier`
            if (id.includes(`codemirror`))
              return `codemirror`
            // Vue 生态单独分包
            if (id.includes(`@vue`) || id.includes(`vue-router`))
              return `vue-eco`
            // UI 组件库单独分包
            if (id.includes(`radix-vue`) || id.includes(`reka-ui`))
              return `ui-libs`
            const pkg = id
              .split(`node_modules/`)[1]
              .split(`/`)[0]
              .replace(`@`, `npm_`)
            return `vendor_${pkg}`
          }
        },
      },
    },
  },
})
