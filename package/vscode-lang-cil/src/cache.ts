
import { Parser } from "web-tree-sitter";
import * as ts from "web-tree-sitter";
import * as vscode from "vscode";

// TODO: "tree-sitter.wasm" non viene riportato quando buildi

export class FileAstCache {
  constructor(public parser: Parser) { }

  cache = new Map<string, ts.Tree>();

  get(doc: vscode.TextDocument) {
    const { cache } = this;
    const file = doc.uri.toString();
    var tree = cache.get(file);
    if (!tree) cache.set(file, tree = this.parser.parse(doc.getText())!);
    return tree;
  }

  edit(doc: vscode.TextDocument, changes: readonly vscode.TextDocumentContentChangeEvent[]) {
    const { cache } = this;
    const file = doc.uri.toString();
    const tree = cache.get(file);
    if (!tree) return;
    for (const elm of changes.toSorted((a, b) => b.rangeOffset - a.rangeOffset))
      tree.edit(fromChangeToEdit(elm));
    cache.set(file, this.parser.parse(doc.getText(), tree)!);
  }

  remove(doc: vscode.TextDocument) {
    this.cache.delete(doc.uri.toString());
  }
}

function fromChangeToEdit(change: vscode.TextDocumentContentChangeEvent): ts.Edit {
  const start = fromPositionToPoint(change.range.start);
  const lines = change.text.split("\n");
  return new ts.Edit({
    startIndex: change.rangeOffset,
    oldEndIndex: change.rangeOffset + change.rangeLength,
    newEndIndex: change.rangeOffset + change.text.length,
    startPosition: start,
    oldEndPosition: fromPositionToPoint(change.range.end),
    newEndPosition: {
      row: start.row + lines.length - 1,
      column: lines[lines.length - 1].length + (lines.length === 1 ? start.column : 0),
    }
  });
}

function fromPositionToPoint(position: vscode.Position): ts.Point {
  return {
    row: position.line,
    column: position.character,
  };
}