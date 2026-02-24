"use client";

import * as React from "react";
import { Box, Stack, Typography, Button, Chip } from "@mui/material";

export default function ManifestoAct({ completed, onStamp }) {
  return (
    <Stack spacing={2.25}>
      <Typography sx={{ opacity: 0.9 }}>
        Before you hit the Midway — here’s the deal:
      </Typography>

      <Stack spacing={1.25}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        >
          <Typography fontWeight={950} sx={{ mb: 0.75 }}>
            1) The “AI purity test” is gatekeeping.
          </Typography>
          <Typography sx={{ opacity: 0.88 }}>
            “If you use AI you’re not a real ____” isn’t a standard — it’s a vibe-check.
            We’re here for outcomes.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        >
          <Typography fontWeight={950} sx={{ mb: 0.75 }}>
            2) Unless you’re coding in 0s and 1s… you’re using abstractions too.
          </Typography>
          <Typography sx={{ opacity: 0.88 }}>
            Frameworks, compilers, IDEs, libraries — abstraction is the entire industry.
            Nobody gets to crown their “hack” morally superior.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        >
          <Typography fontWeight={950} sx={{ mb: 0.75 }}>
            3) We’re AI-forward on purpose.
          </Typography>
          <Typography sx={{ opacity: 0.88 }}>
            It’s how a small team ships at scale — with humans owning accuracy, intent, and accountability.
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} alignItems="center">
        {completed ? (
          <Chip
            label="✅ Entry Ticket Stamped"
            sx={{
              border: "1px solid rgba(250,204,21,0.35)",
              backgroundColor: "rgba(250,204,21,0.10)",
            }}
          />
        ) : (
          <Chip
            label="🔒 Stamp required to enter Midway"
            sx={{
              border: "1px dashed rgba(225,29,72,0.55)",
              backgroundColor: "rgba(0,0,0,0.18)",
            }}
          />
        )}

        <Button
          onClick={onStamp}
          variant="contained"
          sx={{
            borderRadius: 999,
            px: 3,
            backgroundImage:
              "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
          }}
        >
          Stamp Entry Ticket
        </Button>
      </Stack>
    </Stack>
  );
}