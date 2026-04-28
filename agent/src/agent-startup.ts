import React from "react";
import { render } from "ink";
import { App } from "./tui/App.js";

export async function startAgent(_configPath?: string): Promise<void> {
  render(React.createElement(App));
}
