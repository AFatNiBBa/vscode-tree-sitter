
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    target: "ESNext",
    rollupOptions: {
      external: [ "vscode" ]
    },
    lib: {
      entry: "src/index.ts",
      formats: [ "cjs" ],
      fileName: "index"
    }
  }
});
