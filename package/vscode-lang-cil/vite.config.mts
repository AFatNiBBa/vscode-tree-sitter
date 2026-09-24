
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
  },
  plugins: [
    {
      name: "vite-plugin-web-tree-sitter-wasm",
      async generateBundle() {
        const pkg = "web-tree-sitter", file = `${pkg}.wasm`;
        const resolved = await this.resolve(`${pkg}/${file}`);
        this.emitFile({
          type: "asset",
          fileName: file,
          source: await this.fs.readFile(resolved!.id) // Vite doesn't know automatically that this file exists because it is dynamically loaded
        });
      }
    }
  ]
});