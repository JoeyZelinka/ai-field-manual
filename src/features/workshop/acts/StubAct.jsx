"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";

export default function StubAct({ title, subtitle }) {
  return (
    <Stack spacing={2}>
      <Typography sx={{ opacity: 0.9 }}>{subtitle}</Typography>

      <Box
        sx={{
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.18)",
          p: 3,
          textAlign: "center",
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ opacity: 0.75 }}>
          (Drop art + drag-n-drop mini-game here next.)
        </Typography>
      </Box>
    </Stack>
  );
}