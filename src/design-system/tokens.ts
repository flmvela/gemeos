// Central place to list semantic tokens used by the design system page.
// Values come from CSS variables (see src/index.css). This file is for display/documentation only.

export type ColorToken = {
  name: string;
  cssVar: string; // e.g., --primary
};

export const colorTokens: ColorToken[] = [
  { name: "background", cssVar: "--background" },
  { name: "foreground", cssVar: "--foreground" },
  { name: "card", cssVar: "--card" },
  { name: "primary", cssVar: "--primary" },
  { name: "secondary", cssVar: "--secondary" },
  { name: "accent", cssVar: "--accent" },
  { name: "success", cssVar: "--success" },
  { name: "info", cssVar: "--info" },
  { name: "warning", cssVar: "--warning" },
  { name: "purple", cssVar: "--purple" },
  { name: "destructive", cssVar: "--destructive" },
  { name: "muted", cssVar: "--muted" },
  { name: "border", cssVar: "--border" },
  { name: "ring", cssVar: "--ring" },
  // Admin dashboard extras
  { name: "stat-concepts", cssVar: "--stat-concepts" },
  { name: "stat-goals", cssVar: "--stat-goals" },
  { name: "stat-exercises", cssVar: "--stat-exercises" },
  { name: "status-active-bg", cssVar: "--status-active-bg" },
  { name: "status-draft-bg", cssVar: "--status-draft-bg" },
];
