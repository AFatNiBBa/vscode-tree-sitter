
import highlight from "../assets/highlights.scm?raw";

import Parser from "web-tree-sitter";
import { CilSemanticTokenProvider } from "./provider";
import { FileAstCache } from "./cache";
import { LEGEND } from "./legend";
import * as vscode from "vscode";

// TODO: https://vshaxe.github.io/vscode-extern/vscode/DocumentSemanticTokensProvider.html >> "provideDocumentSemanticTokensEdits"?
// TODO: https://github.com/EvgeniyPeshkov/syntax-highlighter/blob/master/src/extension.ts
// TODO: https://github.com/AlecGhost/tree-sitter-vscode/blob/master/src/extension.ts
// TODO: https://github.com/microsoft/vscode-extension-samples/blob/main/semantic-tokens-sample/src/extension.ts

export async function activate(ctx: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Unga");

  await Parser.init(); // TODO: Non prosegue

  vscode.window.showInformationMessage("Bunga");

  const parser = new Parser();
  const wasm = import.meta.resolve("../assets/tree-sitter-cil.wasm"); // Relativo a "dist"

  const lang = await Parser.Language.load(wasm);
  parser.setLanguage(lang);
  const cache = new FileAstCache(parser);
  const query = lang.query(highlight);
  const provider = new CilSemanticTokenProvider(cache, query);
  const sub = ctx.subscriptions;

  sub.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: "cil" }, provider, LEGEND));
  sub.push(vscode.workspace.onDidChangeTextDocument(e => cache.edit(e.document, e.contentChanges)));
  sub.push(vscode.workspace.onDidCloseTextDocument(x => cache.remove(x)));
}