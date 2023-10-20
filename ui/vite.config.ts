import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
// import fs from "fs"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@/": path.resolve(__dirname, "src"),
      "@/atoms": path.resolve(__dirname, "src/components/atoms"),
      "@/molecules": path.resolve(__dirname, "src/components/molecules"),
      "@/organisms": path.resolve(__dirname, "src/components/organisms"),
      "@/typography": path.resolve(__dirname, "src/components/typography"),
      "@/views": path.resolve(__dirname, "src/components/views"),
      "@/hooks": path.resolve(__dirname, "src/hooks"),
      "@/contexts": path.resolve(__dirname, "src/contexts"),
      "@/styles": path.resolve(__dirname, "src/styles"),
      "@/utils": path.resolve(__dirname, "src/utils"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
  esbuild: {
    // https://github.com/vitejs/vite/issues/8644#issuecomment-1159308803
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          "babel-plugin-macros",
          [
            "@emotion/babel-plugin-jsx-pragmatic",
            {
              export: "jsx",
              import: "__cssprop",
              module: "@emotion/react",
            },
          ],
          [
            "@babel/plugin-transform-react-jsx",
            { pragma: "__cssprop" },
            "twin.macro",
          ],
        ],
      },
    }),
  ],
  envDir: "../",
  server: {
    proxy: {
      "/refresh_token": {
        target: "http://localhost:1337/refresh_token",
      },
      "/graphql": {
        target: "http://localhost:1337/graphql",
      },
    },
  },
})
