
import * as vscode from "vscode";

export const TOKEN_TYPES = [
  "namespace",
  "class",
  "enum",
  "interface",
  "struct",
  "typeParameter",
  "type",
  "parameter",
  "variable",
  "property",
  "enumMember",
  "decorator",
  "event",
  "function",
  "method",
  "macro",
  "label",
  "comment",
  "string",
  "keyword",
  "number",
  "regexp",
  "operator",
];

export const TOKEN_MODIFIERS = [
  "declaration",
  "definition",
  "readonly",
  "static",
  "deprecated",
  "abstract",
  "async",
  "modification",
  "documentation",
  "defaultLibrary",
];

export const LEGEND = new vscode.SemanticTokensLegend(TOKEN_TYPES, TOKEN_MODIFIERS);