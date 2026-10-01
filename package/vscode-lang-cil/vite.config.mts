
import { PluginContext } from "rolldown";
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
      formats: [ "cjs" ],
      fileName: "index"
    }
  },
  plugins: [
    {
      name: "vite-plugin-web-tree-sitter-wasm",
      async generateBundle() {
        await wasm(this, "web-tree-sitter");
        await wasm(this, "@seanalunni/tree-sitter-cil", "tree-sitter-cil.wasm");
      }
    }
  ]
});

/**
 * Emits a WebAssembly file as an asset in the Vite build process.
 * This is necessary because Vite doesn't automatically detect dynamically loaded files.
 * @param ctx The Vite plugin context
 * @param pkg The name of the package containing the WebAssembly file
 * @param file The WebAssembly file name
 */
async function wasm(ctx: PluginContext, pkg: string, file = `${pkg}.wasm`) {
  const resolved = await ctx.resolve(`${pkg}/${file}`);
  ctx.emitFile({
    type: "asset",
    fileName: file,
    source: await ctx.fs.readFile(resolved!.id) 
  });
}