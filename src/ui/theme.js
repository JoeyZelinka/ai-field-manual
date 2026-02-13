import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",

    primary: { main: "#E11D48" },   // big-top red
    secondary: { main: "#F59E0B" }, // marquee gold
    warning: { main: "#FACC15" },   // brighter gold
    info: { main: "#38BDF8" },      // cool spotlight accent

    background: {
      default: "#09070B",
      paper: "rgba(18, 10, 12, 0.82)",
    },
    text: {
      primary: "rgba(255,255,255,0.92)",
      secondary: "rgba(255,255,255,0.72)",
    },
  },

  shape: { borderRadius: 18 },

  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    h2: { fontWeight: 950, letterSpacing: "-0.02em" },
    h3: { fontWeight: 950, letterSpacing: "-0.02em" },
    h4: { fontWeight: 900, letterSpacing: "-0.01em" },
    h5: { fontWeight: 900 },
    button: { fontWeight: 900, textTransform: "none" },
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(255,255,255,0.14)",
          backgroundImage:
            "linear-gradient(135deg, rgba(225,29,72,0.10), rgba(245,158,11,0.06))",
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingLeft: 18,
          paddingRight: 18,
        },
        containedPrimary: {
          backgroundImage:
            "linear-gradient(90deg, rgba(225,29,72,1), rgba(245,158,11,1))",
          boxShadow: "0 14px 36px rgba(225,29,72,0.18)",
        },
        outlined: {
          borderStyle: "dashed",
          borderWidth: 2,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.04)",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "rgba(255,255,255,0.12)" },
      },
    },
  },
});