import React from "react";
import { Box, Text, useStdout } from "ink";
import { createTheme } from "../theme/index.js";
import { countWorkspaceStats } from "../theme/workspace-stats.js";

interface BannerAreaProps {
  config?: {
    workspace?: { root: string };
  };
}

export function BannerArea({ config }: BannerAreaProps) {
  const theme = createTheme();

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{theme.banner}</Text>
      <Text>{theme.separator}</Text>
      {config?.workspace?.root && (
        <>
          <Text>
            {theme.statusBar(
              ...(() => {
                const stats = countWorkspaceStats(config.workspace.root);
                return [stats.workspacePath, stats.serviceCount, stats.artifactCount] as const;
              })()
            )}
          </Text>
          <Text>{theme.separator}</Text>
        </>
      )}
    </Box>
  );
}
