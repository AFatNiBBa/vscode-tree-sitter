
import { readFile } from "fs/promises";
import { join } from "path";
import * as ts from "web-tree-sitter";

await ts.Parser.init();

const parser = new ts.Parser();

const lang = await ts.Language.load(join(import.meta.dirname, "./assets/tree-sitter-cil.wasm"));
parser.setLanguage(lang);

const source = await readFile("C:/Users/alunnis/Downloads/cil/tree-sitter-cil/assets/test.il", "utf-8");
const tree = parser.parse(source);

const q = new ts.Query(lang, "(ref_method) @a");

for (const { captures: [ { node } ] } of q.matches(tree.rootNode))
  console.log(source.slice(node.startIndex, node.endIndex));