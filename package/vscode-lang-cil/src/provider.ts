
import * as ts from "web-tree-sitter";
import * as vscode from "vscode";

export class CilSemanticTokenProvider implements vscode.DocumentSemanticTokensProvider {
  cache = new Map<string, ts.Tree>();

  provideDocumentSemanticTokens(doc: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SemanticTokens> {
    throw new Error("Method not implemented.");
  }

  edit(file: string, changes: readonly vscode.TextDocumentContentChangeEvent[]) {
    throw new Error("Method not implemented.");
  }

  remove(file: string) {
    this.cache.delete(file);
  }
}