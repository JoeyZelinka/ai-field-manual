"use client";

import * as React from "react";
import { Box, Card, CardContent } from "@mui/material";

const ROOF_H = 64;          // roof height
const ROOF_OVERLAP = 12;    // how much the roof covers the body (border only)
const ROOF_OVERHANG = 12;   // how far roof sticks out past the body (fixes corner peek)

export default function TentCard({
  children,
  sx,
  cardSx,
  contentSx,
  ...props
}) {
  return (
    <Box
      sx={{
        position: "relative",
        // space for roof; roof overlaps the top border a bit
        pt: `${ROOF_H - ROOF_OVERLAP}px`,
        ...sx,
      }}
      {...props}
    >
      {/* Roof */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: -ROOF_OVERHANG,
          right: -ROOF_OVERHANG,
          height: ROOF_H,
          zIndex: 3,
          pointerEvents: "none",

          // slightly wider triangle so wide tents don't show corners
          clipPath: "polygon(50% 0%, -2% 100%, 102% 100%)",

          border: "1px solid rgba(255,255,255,0.18)",
          backgroundImage: `
            linear-gradient(135deg, rgba(0,0,0,0.22), rgba(0,0,0,0.00)),
            repeating-linear-gradient(
              90deg,
              rgba(225,29,72,0.95) 0px,
              rgba(225,29,72,0.95) 24px,
              rgba(250,204,21,0.85) 24px,
              rgba(250,204,21,0.85) 48px
            )
          `,
          filter: "drop-shadow(0 18px 50px rgba(0,0,0,0.35))",

          // ✅ flat “eave” strip at the bottom to cover any top-edge peek
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -10,
            height: 18,
            backgroundImage: `
              linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.00)),
              repeating-linear-gradient(
                90deg,
                rgba(225,29,72,0.95) 0px,
                rgba(225,29,72,0.95) 24px,
                rgba(250,204,21,0.85) 24px,
                rgba(250,204,21,0.85) 48px
              )
            `,
            opacity: 0.95,
          },

          // little marquee “cap” line
          "&::after": {
            content: '""',
            position: "absolute",
            left: "18%",
            right: "18%",
            bottom: 8,
            height: 2,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(250,204,21,0.0), rgba(250,204,21,0.55), rgba(250,204,21,0.0))",
            opacity: 0.9,
          },
        }}
      />

      {/* Flag */}
      <Box
        sx={{
          position: "absolute",
          top: -6,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 4,
          width: 2,
          height: 24,
          background: "rgba(255,255,255,0.35)",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 2,
            left: 2,
            width: 18,
            height: 10,
            borderRadius: "0 8px 8px 0",
            background:
              "linear-gradient(90deg, rgba(225,29,72,1), rgba(250,204,21,1))",
            boxShadow: "0 8px 18px rgba(225,29,72,0.20)",
          },
        }}
      />

      {/* Tent body */}
      <Card
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,

          // trapezoid walls
          clipPath: "polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)",

          border: "1px solid rgba(255,255,255,0.14)",
          backgroundImage: `
            linear-gradient(135deg, rgba(18,10,12,0.78), rgba(225,29,72,0.10)),
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.05) 0px,
              rgba(255,255,255,0.05) 18px,
              rgba(0,0,0,0.00) 18px,
              rgba(0,0,0,0.00) 36px
            )
          `,
          boxShadow: "0 18px 60px rgba(0,0,0,0.35)",

          transition: "transform 140ms ease, border-color 140ms ease",
          "&:hover": {
            transform: "translateY(-3px)",
            borderColor: "rgba(250,204,21,0.32)",
          },

          ...cardSx,
        }}
      >
        {/* ✅ extra top padding so roof overlap never eats your first row */}
        <CardContent sx={{ pt: 4, ...contentSx }}>{children}</CardContent>
      </Card>
    </Box>
  );
}