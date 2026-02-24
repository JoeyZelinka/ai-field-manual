"use client";

import * as React from "react";
import { Box, Card, CardContent } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

const ROOF_H = 64;          // roof height
const ROOF_OVERLAP = 12;    // how much the roof covers the body (border only)
const ROOF_OVERHANG = 12;   // how far roof sticks out past the body (fixes corner peek)

const MotionBox = motion(Box);
const MotionCard = motion(Card);

export default function TentCard({ children, sx, cardSx, contentSx, ...props }) {
  const reduce = useReducedMotion();

  // Parent just provides the "rest/hover" state machine
  const wrapVariants = {
    rest: {},
    hover: {},
  };

  const roofVariants = {
    rest: { rotate: 0 },
    hover: reduce
      ? { rotate: 0 }
      : {
          // spin fast, then come back to normal WHILE still hovered
          rotate: [0, 1080, 0],
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
  };

  const cardVariants = {
    rest: {
      y: 0,
      borderColor: "rgba(255,255,255,0.14)",
      boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
    },
    hover: {
      y: reduce ? 0 : -3,
      borderColor: "rgba(250,204,21,0.32)",
      boxShadow: "0 22px 70px rgba(0,0,0,0.42)",
      transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <MotionBox
      inherit={false}
      variants={wrapVariants}
      initial="rest"
      animate="rest"
      whileHover="hover"
      sx={{
        position: "relative",
        pt: `${ROOF_H - ROOF_OVERLAP}px`,
        ...sx,
      }}
      {...props}
    >
      {/* Roof (now motion-driven) */}
      <MotionBox
        inherit={false}
        variants={roofVariants}
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

          // make spins look "centered"
          transformOrigin: "50% 55%",

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
      <MotionCard
        inherit={false}
        elevation={0}
        variants={cardVariants}
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          willChange: "transform",
        }}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 1,
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
          ...cardSx,
        }}
      >
        <CardContent sx={{ pt: 4, ...contentSx }}>{children}</CardContent>
      </MotionCard>
    </MotionBox>
  );
}