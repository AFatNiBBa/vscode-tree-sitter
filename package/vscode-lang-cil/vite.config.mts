
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    target: "ESNext",
    rollupOptions: {
      external: [ "fs/promises", "module", "vscode" ]
    },
    lib: {
      entry: "src/index.ts",
      formats: [ "es" ],
      fileName: "index"
    }
  }
});
