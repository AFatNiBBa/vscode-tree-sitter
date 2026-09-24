
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    target: "ESNext",
    rollupOptions: {
      external: [ "fs", "path", "vscode" ]
    },
    lib: {
      entry: "src/index.ts",
      formats: [ "cjs" ],
      fileName: "index"
    }
  },
  define: {
    "import.meta.resolve": "require.resolve"
  }
});
