"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Stack, Typography, Button } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const DUNKED_SHOTS = new Set(["cannonball", "full_send", "legendary"]);

const DUNK_TANK = {
  intro: "Somebody on the Midway is running their mouth. Don’t debate—DUNK. Pick your shot.",
  preamble: [
    "",
  ],
  take: "“If you use AI, you’re not a real ____.”",
  shots: [
    {
      id: "splash",
      label: "Splash Shot",
      caption: "Calm. Correct. No theatrics.",
      shout: "SPLASH!",
      response:
        "That’s gatekeeping. Tools don’t define craft—outcomes do. I’ll own the result and validate the work.",
    },
    {
      id: "soaked",
      label: "Soaker",
      caption: "Purity test reversal. Friendly… but firm.",
      shout: "SOAKED!",
      response:
        "If you’re not coding in 0s and 1s, you’re using abstractions too. You don’t get to pretend your hack is holier than mine.",
    },
    {
      id: "cannonball",
      label: "Cannonball",
      caption: "Adds the company stance. Turns the crowd.",
      shout: "CANNONBALL!",
      response:
        "We’re AI-forward here. We use it openly because it’s how a small team outputs like a much bigger one—still accountable, just faster.",
    },
    {
      id: "full_send",
      label: "Full Send",
      caption: "Sharper. Still workplace-safe.",
      shout: "FULL SEND!",
      response:
        "If you want purity, go hand-assemble machine code. We’re here to deliver—same responsibility, better leverage, bigger output.",
    },
    {
      id: "legendary",
      label: "Perfect Hit",
      caption: "The definitive closer. Debate over.",
      shout: "DIRECT HIT!",
      response:
        "Compilers, frameworks, IDEs, AI—tools are tools. Unless you’re flipping bits by hand, you’re in the abstraction stack too. Difference is: we ship.",
    },
  ],
};

function findShot(id) {
  return DUNK_TANK.shots.find((s) => s.id === id) || null;
}

function DunkTankArt({ shotId }) {
  const reduce = useReducedMotion();

  const imgSrc = DUNKED_SHOTS.has(shotId)
    ? "/dunk_tank_dunked_wide.png"
    : "/dunk_tank_wide.png";

  return (
    <Stack
      spacing={1}
      sx={{
        width: "100%",
        maxWidth: 1100,     // ✅ let it breathe (tweak to taste)
        mx: "auto",
      }}
    >
      <MotionBox
        key={imgSrc}
        initial={{ opacity: 0, scale: reduce ? 1 : 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        sx={{ width: "100%" }}
      >
        {/* ✅ Natural aspect ratio, no container constraints */}
        <Box
          component="img"
          src={imgSrc}
          alt="Dunk tank"
          loading="eager"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </MotionBox>

      {/* Optional: keep the little line, but NOT as an overlay */}
      <Typography sx={{ fontSize: 12, opacity: 0.85, textAlign: "left" }}>
        Aim at the take. Ring the bell. Drop the ego.
      </Typography>
    </Stack>
  );
}

export default function DunkTankAct({ value, onPick }) {
  const shotObj = value ? findShot(value) : null;

  return (
    <Stack spacing={2.25}>
      <Typography sx={{ opacity: 0.92 }}>{DUNK_TANK.intro}</Typography>

      <Stack spacing={1.1}>
        {DUNK_TANK.preamble.map((line, i) => (
          <Typography key={i} sx={{ opacity: 0.9 }}>
            {line}
          </Typography>
        ))}
      </Stack>

      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 1.4,
          py: 0.8,
          borderRadius: 999,
          border: "1px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.22)",
          width: "fit-content",
        }}
      >
        <Typography fontWeight={900} sx={{ mr: 1, opacity: 0.95 }}>
          The Take:
        </Typography>
        <Typography sx={{ opacity: 0.9 }}>"If you use AI, you’re not a real ____.” is gatekeeping. Full stop."</Typography>
      </Box>

      <DunkTankArt shotId={value} />

      

      <Box
        sx={{
          p: 2.25,
          borderRadius: 2,
          border: "1px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.22)",
          maxWidth: 900,
          mx: "auto",
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 1 }}>
          Your rebuttal
        </Typography>

        {shotObj?.response ? (
          <Typography sx={{ opacity: 0.92, lineHeight: 1.55 }}>“{shotObj.response}”</Typography>
        ) : (
          <Typography sx={{ opacity: 0.65 }}>Pick a shot to generate your response.</Typography>
        )}
      </Box>

      <Stack spacing={1.25}>
        {DUNK_TANK.shots.map((s) => {
          const on = value === s.id;
          return (
            <Button
              key={s.id}
              fullWidth
              onClick={() => onPick(s.id)}
              variant="outlined"
              sx={{
                py: 1.4,
                borderRadius: 999,
                borderStyle: "dashed",
                borderWidth: 2,
                borderColor: on ? "rgba(250,204,21,0.75)" : "rgba(225,29,72,0.50)",
                color: on ? "rgba(250,204,21,0.95)" : "rgba(255,255,255,0.88)",
                backgroundColor: on ? "rgba(250,204,21,0.08)" : "rgba(0,0,0,0.14)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
                textAlign: "left",
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }}>
                <Typography fontWeight={950} sx={{ minWidth: { sm: 170 } }}>
                  {s.label}
                </Typography>
                <Typography sx={{ opacity: 0.78, fontSize: 13 }}>{s.caption}</Typography>
              </Stack>
            </Button>
          );
        })}
      </Stack>
    </Stack>
  );
}