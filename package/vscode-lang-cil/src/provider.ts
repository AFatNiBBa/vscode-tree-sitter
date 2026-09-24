
import { TOKEN_TYPES, TOKEN_MODIFIERS, LEGEND } from "./legend";
import { FileAstCache } from "./cache";
import * as ts from "web-tree-sitter";
import * as vscode from "vscode";

// TODO: Fold!
// TODO: Injection!
// TODO: Serve "onLanguage:cil"? > (Sul "package.json")

const SEMANTIC_TOKEN_TYPE_MAPPINGS: Record<string, { type: string; modifiers?: string[] }> = {
  "string": { type: "string" }
};

export class CilSemanticTokenProvider implements vscode.DocumentSemanticTokensProvider {
  constructor(public cache: FileAstCache, public highlight: ts.Query) { }

  provideDocumentSemanticTokens(doc: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
    const tree = this.cache.get(doc);
    const builder = new vscode.SemanticTokensBuilder(LEGEND);
    for (const elm of getTokens(tree, this.highlight, { row: 0, column: 0 }))
      builder.push(elm.range, elm.type, elm.modifiers);
    return builder.build();
  }
}

function getTokens(tree: ts.Tree, highlight: ts.Query, start: ts.Point) {
  const matches = highlight.matches(tree.rootNode); // TODO: Passa "start" qui?
  const tokens = Iterator.from(matches).flatMap(fromMatchToToken).toArray();
  const pos = fromPointToPosition(start);
  for (const elm of tokens)
    elm.range = addPosition(elm.range, pos);
  return tokens;
}

function fromMatchToToken(match: ts.QueryMatch) {
  // TODO: Meglio
  const unsplitTokens = match
    .captures
    .flatMap(capture => {
      // Store the original capture name before splitting
      const originalCaptureName = capture.name;
      let { type, modifiers } = parseCaptureName(capture.name);
      const start = fromPointToPosition(capture.node.startPosition);
      const end = fromPointToPosition(capture.node.endPosition);

      // First check if we have a mapping for the original unsplit name
      if (
        SEMANTIC_TOKEN_TYPE_MAPPINGS &&
        Object.prototype.hasOwnProperty.call(
          SEMANTIC_TOKEN_TYPE_MAPPINGS,
          originalCaptureName,
        )
      ) {
        const mapping = SEMANTIC_TOKEN_TYPE_MAPPINGS[originalCaptureName];

        type = mapping.type;
        modifiers = mapping.modifiers ?? [];

        
      }
      // If no mapping for the full name, check for just the type
      else if (
        SEMANTIC_TOKEN_TYPE_MAPPINGS &&
        Object.prototype.hasOwnProperty.call(
          SEMANTIC_TOKEN_TYPE_MAPPINGS,
          type,
        )
      ) {
        const mapping = SEMANTIC_TOKEN_TYPE_MAPPINGS[type];

        type = mapping.type;
        modifiers = mapping.modifiers ?? [];

        
      }

      if (TOKEN_TYPES.includes(type)) {
        const validModifiers = modifiers.filter((modifier) =>
          TOKEN_MODIFIERS.includes(modifier),
        );
        const token: Token = {
          range: new vscode.Range(start, end),
          type: type,
          modifiers: validModifiers,
        };
        return token;
      } else {
        return [];
      }
    });

  return Iterator
    .from(unsplitTokens)
    .flatMap(token => {
      // Get all tokens contained within this token
      const contained = unsplitTokens.filter(
        (t) => !token.range.isEqual(t.range) && token.range.contains(t.range),
      );

      if (contained.length > 0) {
        // Sort contained tokens by their start position
        const sortedContained = contained.sort((a, b) =>
          a.range.start.compareTo(b.range.start),
        );

        const resultTokens: Token[] = [];
        let currentPos = token.range.start;

        // Create tokens for the gaps between contained tokens
        for (const containedToken of sortedContained) {
          // If there's a gap before this contained token, create a token for it
          if (currentPos.compareTo(containedToken.range.start) < 0) {
            resultTokens.push({
              ...token,
              range: new vscode.Range(currentPos, containedToken.range.start),
            });
          }
          currentPos = containedToken.range.end;
        }

        // Add token for the gap after the last contained token if needed
        if (currentPos.compareTo(token.range.end) < 0) {
          resultTokens.push({
            ...token,
            range: new vscode.Range(currentPos, token.range.end),
          });
        }

        return resultTokens;
      } else {
        return [token];
      }
    });
}

function fromPointToPosition(point: ts.Point) {
  return new vscode.Position(point.row, point.column);
}

function addPosition(range: vscode.Range, pos: vscode.Position): vscode.Range {
  // TODO: Meglio
  const start =
    range.start.line == 0
      ? new vscode.Position(
          range.start.line + pos.line,
          range.start.character + pos.character,
        )
      : new vscode.Position(range.start.line + pos.line, range.start.character);
  const end =
    range.end.line == 0
      ? new vscode.Position(
          range.end.line + pos.line,
          range.end.character + pos.character,
        )
      : new vscode.Position(range.end.line + pos.line, range.end.character);
  return new vscode.Range(start, end);
}

function parseCaptureName(name: string): { type: string; modifiers: string[] } {
  const modifiers = name.split(".");
  if (!modifiers.length) throw new Error("Capture name is empty");
  return { type: modifiers.pop()!, modifiers };
}

interface Token {
  range: vscode.Range;
  type: string;
  modifiers: string[];
}