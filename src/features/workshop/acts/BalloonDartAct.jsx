"use client";

import * as React from "react";
import { Box, Stack, Typography, Button, Chip, Divider } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const BALLOONS = {
  title: "Balloon Dart",
  intro:
    "Pop the risky balloons. Sort each item into SAFE or NOT SAFE for prompts. (Drag or click → then click a zone.)",
  artHint: "Drop balloon dart art here later.",
  zones: [
    { id: "safe", label: "SAFE", helper: "Public or sanitized content", icon: "🟢" },
    { id: "unsafe", label: "NOT SAFE", helper: "Secrets, PII, confidential data", icon: "🔴" },
  ],
  items: [
    { id: "i1", label: "Public press release text", correct: "safe", why: "Public info is generally fine." },
    { id: "i2", label: "Sanitized bug report (no names/emails)", correct: "safe", why: "Sanitized is the key." },
    { id: "i3", label: "Customer email list (names + emails)", correct: "unsafe", why: "PII. Don’t paste it." },
    { id: "i4", label: "API key / token", correct: "unsafe", why: "Secret. Never." },
    { id: "i5", label: "Internal revenue numbers for next quarter", correct: "unsafe", why: "Confidential business data." },
    { id: "i6", label: "Mock data / synthetic examples", correct: "safe", why: "Best practice: use fake but realistic." },
    { id: "i7", label: "Password reset link", correct: "unsafe", why: "Sensitive, can be exploited." },
    { id: "i8", label: "Code snippet with no secrets", correct: "safe", why: "Usually safe (still review for keys)." },
    { id: "i9", label: "Medical info about an employee", correct: "unsafe", why: "Sensitive personal data." },
    { id: "i10", label: "A redacted log (tokens replaced with [REDACTED])", correct: "safe", why: "Redaction makes it workable." },
  ],
};

function findItem(id) {
  return BALLOONS.items.find((x) => x.id === id) || null;
}

function score(placements) {
  let total = 0;
  let correct = 0;

  for (const z of BALLOONS.zones) {
    const ids = placements[z.id] || [];
    for (const id of ids) {
      total += 1;
      const item = findItem(id);
      if (item?.correct === z.id) correct += 1;
    }
  }

  return { total, correct, pct: total ? Math.round((correct / total) * 100) : 0 };
}

export default function BalloonDartAct({ value, onComplete }) {
  const reduce = useReducedMotion();

  const initial = React.useMemo(() => {
    const v = value && typeof value === "object" ? value : null;
    const placements =
      v?.placements && typeof v.placements === "object"
        ? v.placements
        : { safe: [], unsafe: [] };

    placements.safe = placements.safe || [];
    placements.unsafe = placements.unsafe || [];

    const placed = new Set([...(placements.safe || []), ...(placements.unsafe || [])]);
    const bank = BALLOONS.items.map((i) => i.id).filter((id) => !placed.has(id));

    return { placements, bank };
  }, [value]);

  const [placements, setPlacements] = React.useState(initial.placements);
  const [bank, setBank] = React.useState(initial.bank);
  const [armedId, setArmedId] = React.useState(null);

  const { total, correct, pct } = React.useMemo(() => score(placements), [placements]);
  const allPlaced = total === BALLOONS.items.length;
  const isStamped = Boolean(value);

  const move = (itemId, zoneId) => {
    setPlacements((prev) => {
      const next = {
        safe: (prev.safe || []).filter((x) => x !== itemId),
        unsafe: (prev.unsafe || []).filter((x) => x !== itemId),
      };
      next[zoneId] = [...(next[zoneId] || []), itemId];
      return next;
    });

    setBank((prev) => prev.filter((x) => x !== itemId));
    setArmedId(null);
  };

  const handleDrop = (e, zoneId) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    if (!itemId) return;
    move(itemId, zoneId);
  };

  const stamp = () => {
    if (!allPlaced) return;

    onComplete?.({
      type: "balloon_dart",
      placements,
      score: { total, correct, pct },
      completedAt: Date.now(),
    });
  };

  return (
    <Stack spacing={2.5}>
      <Typography sx={{ opacity: 0.92 }}>{BALLOONS.intro}</Typography>

      {/* ART SLOT */}
      <Box
        sx={{
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.18)",
          p: 2.5,
          textAlign: "center",
          opacity: 0.9,
        }}
      >
        <Typography fontWeight={950}>🎨 Balloon Dart Art Slot</Typography>
        <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{BALLOONS.artHint}</Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} alignItems="center">
        <Chip
          label={`Sorted: ${total}/${BALLOONS.items.length}`}
          sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.18)" }}
        />
        <Chip
          label={`Accuracy: ${pct}%`}
          sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(250,204,21,0.22)" }}
        />
        {armedId ? (
          <Chip
            label={`Armed: ${armedId}`}
            sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(56,189,248,0.35)" }}
          />
        ) : null}
      </Stack>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

      {/* ZONES */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        {BALLOONS.zones.map((z) => {
          const ids = placements[z.id] || [];
          return (
            <Zone
              key={z.id}
              label={`${z.icon} ${z.label}`}
              helper={z.helper}
              onDrop={(e) => handleDrop(e, z.id)}
              onClick={() => armedId && move(armedId, z.id)}
              reduce={reduce}
            >
              <Stack spacing={1}>
                {ids.map((id) => {
                  const item = findItem(id);
                  const ok = item?.correct === z.id;
                  return <ItemCard key={id} id={id} label={item?.label} ok={ok} onArm={() => setArmedId(id)} />;
                })}
              </Stack>
            </Zone>
          );
        })}
      </Box>

      {/* BANK */}
      <Box
        sx={{
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.18)",
          backgroundColor: "rgba(0,0,0,0.16)",
          p: 2,
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 1 }}>
          Dart Pouch (drag or click → then click SAFE/NOT SAFE)
        </Typography>

        <Stack spacing={1}>
          {bank.map((id) => {
            const item = findItem(id);
            const armed = armedId === id;
            return (
              <ItemCard
                key={id}
                id={id}
                label={item?.label}
                ok={null}
                armed={armed}
                onArm={() => setArmedId(armed ? null : id)}
              />
            );
          })}
        </Stack>
      </Box>

      {allPlaced ? (
        <Box
          sx={{
            p: 2.25,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        >
          <Typography fontWeight={950} sx={{ mb: 1 }}>
            Rules of the road
          </Typography>
          <Typography sx={{ opacity: 0.88 }}>
            If it’s **secret, identifying, or confidential**, don’t paste it. Use **redaction**, **summaries**, or **synthetic examples**.
            Your best default: “Would I put this on a projector in a room full of strangers?”
          </Typography>
        </Box>
      ) : null}

      <Button
        onClick={stamp}
        disabled={!allPlaced}
        variant="contained"
        sx={{
          borderRadius: 999,
          px: 3,
          alignSelf: "center",
          minWidth: 260,
          backgroundImage: "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
          opacity: allPlaced ? 1 : 0.55,
        }}
      >
        {isStamped ? "Re-stamp (no extra tickets)" : "Ring Bell & Stamp Ticket"}
      </Button>
    </Stack>
  );
}

function Zone({ label, helper, onDrop, onClick, children, reduce }) {
  return (
    <MotionBox
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      whileHover={reduce ? {} : { y: -2 }}
      transition={{ duration: 0.15 }}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "2px dashed rgba(255,255,255,0.22)",
        backgroundColor: "rgba(0,0,0,0.18)",
        cursor: "pointer",
        minHeight: 220,
      }}
    >
      <Typography fontWeight={950}>{label}</Typography>
      <Typography sx={{ opacity: 0.7, fontSize: 12, mb: 1 }}>{helper}</Typography>
      {children}
    </MotionBox>
  );
}

function ItemCard({ id, label, ok, armed, onArm }) {
  const border =
    ok === true
      ? "rgba(250,204,21,0.55)"
      : ok === false
      ? "rgba(225,29,72,0.55)"
      : armed
      ? "rgba(56,189,248,0.55)"
      : "rgba(255,255,255,0.18)";

  return (
    <Box
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", id)}
      onClick={(e) => {
        e.stopPropagation();
        onArm?.();
      }}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: `1px dashed ${border}`,
        backgroundColor: "rgba(0,0,0,0.14)",
        userSelect: "none",
      }}
    >
      <Typography sx={{ opacity: 0.9, fontSize: 13 }}>{label}</Typography>
    </Box>
  );
}