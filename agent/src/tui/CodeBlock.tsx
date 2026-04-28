import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { highlight } from "cli-highlight";

interface CodeBlockProps {
  code: string;
  language?: string;
}

const SUPPORTED_LANGUAGES = new Set([
  "typescript", "ts", "javascript", "js", "python", "py",
  "yaml", "yml", "json", "bash", "sh", "shell",
  "sql", "css", "html", "markdown", "md",
]);

function getLanguage(lang?: string): string | undefined {
  if (!lang) return undefined;
  const normalized = lang.toLowerCase().trim();
  if (SUPPORTED_LANGUAGES.has(normalized)) return normalized;
  return undefined;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const highlighted = useMemo(() => {
    const lang = getLanguage(language);
    try {
      return highlight(code.trimEnd(), {
        language: lang ?? "typescript",
        ignoreIllegals: true,
      });
    } catch {
      return code.trimEnd();
    }
  }, [code, language]);

  return (
    <Box flexDirection="column" marginY={0}>
      <Box>
        <Text color="gray">{"  ┌"}</Text>
        {language && <Text color="cyan" dimColor> {language} </Text>}
        <Text color="gray">{"─".repeat(Math.max(1, 40 - (language?.length ?? 0) * 1))}</Text>
      </Box>
      {highlighted.split("\n").map((line, i) => (
        <Box key={i}>
          <Text color="gray">{"  │ "}</Text>
          <Text>{line}</Text>
        </Box>
      ))}
      <Text color="gray">{"  └" + "─".repeat(43)}</Text>
    </Box>
  );
}
