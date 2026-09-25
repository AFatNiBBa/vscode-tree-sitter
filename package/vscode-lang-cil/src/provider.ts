
import { TOKEN_TYPES, TOKEN_MODIFIERS, LEGEND } from "./legend";
import { FileAstCache } from "./cache";
import * as ts from "web-tree-sitter";
import * as vscode from "vscode";

// TODO: Fold!
// TODO: Injection!

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
    })
    .flatMap(splitToken);
}

/**
 * Semantic tokens cannot span multiple lines,
 * so if the range doesn't end in the same line,
 * one token for each line is created.
 */
function splitToken(token: Token): Token[] {
  // TODO: Meglio
  const start = token.range.start;
  const end = token.range.end;
  if (start.line != end.line) {
    // 100_0000 is chosen as the arbitrary length, since the actual line length is unknown.
    // Choosing a big number works, while `Number.MAX_VALUE` seems to confuse VSCode.
    const maxLineLength = 100_000;
    const lineDiff = end.line - start.line;
    if (lineDiff < 0) {
      throw new RangeError("Invalid token range");
    }
    const tokens: Token[] = [];
    // token for the first line, beginning at the start char
    tokens.push({
      range: new vscode.Range(
        start,
        new vscode.Position(start.line, maxLineLength),
      ),
      type: token.type,
      modifiers: token.modifiers,
    });
    // tokens for intermediate lines, spanning from 0 to maxLineLength
    for (let i = 1; i < lineDiff; i++) {
      const middleToken: Token = {
        range: new vscode.Range(
          new vscode.Position(start.line + i, 0),
          new vscode.Position(start.line + i, maxLineLength),
        ),
        type: token.type,
        modifiers: token.modifiers,
      };
      tokens.push(middleToken);
    }
    // token for the last line, ending at the end char
    tokens.push({
      range: new vscode.Range(new vscode.Position(end.line, 0), end),
      type: token.type,
      modifiers: token.modifiers,
    });
    return tokens;
  } else {
    return [token];
  }
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