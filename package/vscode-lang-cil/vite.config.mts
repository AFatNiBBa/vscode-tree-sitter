
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    target: "ESNext",
    rollupOptions: {
      external: [ "fs", "path", "vscode", "module" ]
    },
    lib: {
      entry: "src/index.ts",
      formats: [ "es" ],
      fileName: "index"
    }
  }
});
