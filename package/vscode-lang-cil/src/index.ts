
import * as vscode from "vscode";

import { CilSemanticTokenProvider } from "./provider";
import { LEGEND } from "./legend";

// TODO: https://vshaxe.github.io/vscode-extern/vscode/DocumentSemanticTokensProvider.html >> "provideDocumentSemanticTokensEdits"?
// TODO: https://github.com/EvgeniyPeshkov/syntax-highlighter/blob/master/src/extension.ts
// TODO: https://github.com/AlecGhost/tree-sitter-vscode/blob/master/src/extension.ts
// TODO: https://github.com/microsoft/vscode-extension-samples/blob/main/semantic-tokens-sample/src/extension.ts

export function activate(ctx: vscode.ExtensionContext) {
  const provider = new CilSemanticTokenProvider();
  const sub = ctx.subscriptions;

  sub.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: "cil" }, provider, LEGEND));
  sub.push(vscode.workspace.onDidChangeTextDocument(e => provider.edit(e.document.uri.toString(), e.contentChanges)));
  sub.push(vscode.workspace.onDidCloseTextDocument(doc => provider.remove(doc.uri.toString())));
}