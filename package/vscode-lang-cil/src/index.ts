
import * as vscode from "vscode";

// TODO: https://vshaxe.github.io/vscode-extern/vscode/DocumentSemanticTokensProvider.html
// TODO: https://github.com/EvgeniyPeshkov/syntax-highlighter/blob/master/src/extension.ts
// TODO: https://github.com/AlecGhost/tree-sitter-vscode/blob/master/src/extension.ts

export function activate(ctx: vscode.ExtensionContext) {
	ctx;

  vscode.window.showInformationMessage("Ciao beppe");
}

export function deactivate() {
  // Nisba
}