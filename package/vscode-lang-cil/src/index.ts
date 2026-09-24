
import highlight from "../assets/highlights.scm?raw";

import { CilSemanticTokenProvider } from "./provider";
import { FileAstCache } from "./cache";
import { LEGEND } from "./legend";
import * as ts from "web-tree-sitter";
import * as vscode from "vscode";

// TODO: https://vshaxe.github.io/vscode-extern/vscode/DocumentSemanticTokensProvider.html >> "provideDocumentSemanticTokensEdits"?
// TODO: https://github.com/EvgeniyPeshkov/syntax-highlighter/blob/master/src/extension.ts
// TODO: https://github.com/AlecGhost/tree-sitter-vscode/blob/master/src/extension.ts
// TODO: https://github.com/microsoft/vscode-extension-samples/blob/main/semantic-tokens-sample/src/extension.ts

export async function activate(ctx: vscode.ExtensionContext) {
  await ts.Parser.init({
    locateFile(file: string, from: string) {
      return `${from}/${file}`; // TODO: Cerca di evitare
    }
  });

  const parser = new ts.Parser();

  const path = vscode.Uri.joinPath(ctx.extensionUri, "assets/tree-sitter-cil.wasm");
  const wasm = await vscode.workspace.fs.readFile(path);
  const lang = await ts.Language.load(wasm);
  parser.setLanguage(lang);

  const cache = new FileAstCache(parser);
  const query = new ts.Query(lang, highlight);
  const provider = new CilSemanticTokenProvider(cache, query);
  const sub = ctx.subscriptions;

  sub.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: "cil" }, provider, LEGEND));
  sub.push(vscode.workspace.onDidChangeTextDocument(e => cache.edit(e.document, e.contentChanges)));
  sub.push(vscode.workspace.onDidCloseTextDocument(x => cache.remove(x)));
}