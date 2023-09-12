import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
// import fs from "fs"
// import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
  // server: {
  //   https: {
  //     key: fs.readFileSync(path.resolve(__dirname, "localhost.key")),
  //     cert: fs.readFileSync(path.resolve(__dirname, "localhost.crt")),
  //   },
  // },
})
