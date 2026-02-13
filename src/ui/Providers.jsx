"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { GlobalStyles } from "@mui/material";
import { theme } from "./theme";

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            minHeight: "100vh",
            backgroundColor: theme.palette.background.default,
            backgroundImage: `
              /* spotlights */
              radial-gradient(900px 520px at 20% 10%, rgba(245,158,11,0.14), transparent 55%),
              radial-gradient(1000px 600px at 85% 18%, rgba(56,189,248,0.10), transparent 55%),
              radial-gradient(900px 620px at 50% 95%, rgba(225,29,72,0.12), transparent 60%),

              /* tent stripes */
              repeating-linear-gradient(
                90deg,
                rgba(225,29,72,0.18) 0px,
                rgba(225,29,72,0.18) 44px,
                rgba(245,158,11,0.10) 44px,
                rgba(245,158,11,0.10) 88px
              ),

              /* subtle canvas grain */
              repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.015) 0px,
                rgba(255,255,255,0.015) 1px,
                transparent 1px,
                transparent 4px
              )
            `,
            backgroundAttachment: "fixed",
          },
          a: { color: "inherit", textDecoration: "none" },
        }}
      />
      {children}
    </ThemeProvider>
  );
}