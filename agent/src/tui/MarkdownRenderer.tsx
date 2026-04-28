import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { marked } from "marked";
import type { Token, Tokens } from "marked";
import { CodeBlock } from "./CodeBlock.js";

interface MarkdownRendererProps {
  content: string;
}

function renderInline(tokens: Token[]): React.ReactNode[] {
  return tokens.map((token, i) => {
    switch (token.type) {
      case "text":
        return <Text key={i}>{token.text}</Text>;
      case "strong":
        return <Text key={i} bold>{renderInline(token.tokens ?? [])}</Text>;
      case "em":
        return <Text key={i} italic>{renderInline(token.tokens ?? [])}</Text>;
      case "codespan":
        return (
          <Text key={i} color="cyan" backgroundColor="gray">
            {" "}{unescape(token.text)}{" "}
          </Text>
        );
      case "link":
        return <Text key={i} color="cyan">{token.text || token.href}</Text>;
      case "br":
        return <Text key={i}>{"\n"}</Text>;
      case "escape":
        return <Text key={i}>{token.text}</Text>;
      default:
        if ("tokens" in token && Array.isArray((token as any).tokens)) {
          return <Text key={i}>{renderInline((token as any).tokens)}</Text>;
        }
        if ("text" in token) {
          return <Text key={i}>{token.text as string}</Text>;
        }
        return null;
    }
  });
}

function unescape(text: string): string {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

const TRUNCATE_THRESHOLD = 500;

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const elements = useMemo(() => {
    let tokens: Token[];
    try {
      tokens = marked.lexer(content);
    } catch {
      return [<Text key="raw">{content}</Text>];
    }

    const result: React.ReactNode[] = [];
    let lineCount = 0;

    for (let idx = 0; idx < tokens.length; idx++) {
      const token = tokens[idx];

      if (lineCount > TRUNCATE_THRESHOLD) {
        const remaining = tokens.length - idx;
        result.push(
          <Text key={`truncate-${idx}`} color="yellow" dimColor>
            {"  "}... {remaining} more block{remaining > 1 ? "s" : ""} truncated
          </Text>
        );
        break;
      }

      switch (token.type) {
        case "heading": {
          const h = token as Tokens.Heading;
          const headingChars = "═".repeat(Math.max(1, 40 - (h.text?.length ?? 0)));
          const level = h.depth;
          const color = level <= 2 ? "cyan" : level === 3 ? "blue" : "gray";
          result.push(
            <Box key={idx} flexDirection="column" marginY={1}>
              {level <= 2 && <Text color="gray" dimColor>{"  "}{headingChars}</Text>}
              <Text color={color} bold>
                {"  " + "#".repeat(level) + " " + (h.tokens ? renderInline(h.tokens) : h.text)}
              </Text>
              {level <= 2 && <Text color="gray" dimColor>{"  "}{headingChars}</Text>}
            </Box>
          );
          lineCount += 3;
          break;
        }

        case "code": {
          const c = token as Tokens.Code;
          result.push(
            <Box key={idx} marginY={1}>
              <CodeBlock code={c.text} language={c.lang ?? undefined} />
            </Box>
          );
          lineCount += c.text.split("\n").length + 2;
          break;
        }

        case "paragraph": {
          const p = token as Tokens.Paragraph;
          result.push(
            <Text key={idx}>
              {"  "}{renderInline(p.tokens)}
            </Text>
          );
          lineCount += 1;
          break;
        }

        case "list": {
          const list = token as Tokens.List;
          const items = list.items.map((item, j) => {
            const prefix = list.ordered ? `${j + 1}. ` : "• ";
            lineCount += 1;
            return (
              <Box key={`${idx}-${j}`} marginLeft={2}>
                <Text color="cyan">{prefix}</Text>
                <Text>{item.tokens ? renderInlineTokens(item.tokens) : item.text}</Text>
              </Box>
            );
          });
          result.push(<Box key={idx} flexDirection="column">{items}</Box>);
          break;
        }

        case "blockquote": {
          const bq = token as Tokens.Blockquote;
          result.push(
            <Box key={idx} flexDirection="column" marginLeft={2} borderStyle="bold" borderColor="gray">
              <Text color="gray">{"  │ "}{bq.text}</Text>
            </Box>
          );
          lineCount += 1;
          break;
        }

        case "hr": {
          result.push(<Text key={idx} color="gray" dimColor>{"  " + "─".repeat(45)}</Text>);
          lineCount += 1;
          break;
        }

        case "table": {
          const table = token as Tokens.Table;
          const headers = table.header.map((h, ci) => (
            <Text key={ci} bold color="cyan">{h.text + "  "}</Text>
          ));
          const rows = table.rows.map((row, ri) => (
            <Box key={ri}>
              {row.map((cell, ci) => (
                <Text key={ci}>{cell.text + "  "}</Text>
              ))}
            </Box>
          ));
          result.push(
            <Box key={idx} flexDirection="column" marginLeft={2} marginY={1}>
              <Box>{headers}</Box>
              <Text color="gray">{"  " + "─".repeat(40)}</Text>
              {rows}
            </Box>
          );
          lineCount += table.rows.length + 2;
          break;
        }

        case "space":
          break;

        default: {
          if ("text" in token && typeof token.text === "string") {
            result.push(<Text key={idx}>{token.text}</Text>);
            lineCount += 1;
          }
          break;
        }
      }
    }

    return result;
  }, [content]);

  return <Box flexDirection="column">{elements}</Box>;
}

function renderInlineTokens(tokens: Token[]): React.ReactNode[] {
  return tokens.map((t, i) => {
    if (t.type === "text") {
      return <Text key={i}>{t.raw}</Text>;
    }
    if (t.type === "paragraph" && "tokens" in t) {
      return <Text key={i}>{renderInline((t as Tokens.Paragraph).tokens)}</Text>;
    }
    if ("tokens" in t && Array.isArray((t as any).tokens)) {
      return <Text key={i}>{renderInline((t as any).tokens)}</Text>;
    }
    if ("text" in t) {
      return <Text key={i}>{t.text as string}</Text>;
    }
    return <Text key={i}>{t.raw}</Text>;
  });
}

export { MarkdownRenderer };
