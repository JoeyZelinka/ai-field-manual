"use client";

import * as React from "react";
import Image from "next/image";
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Paper,
  Tooltip,
  Alert,
} from "@mui/material";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const BALLOON_IMG_SRC = "/balloon.png";
const DART_IMG_SRC = "/dart.png"; // ✅ /public/dart.png

const ROWS = 3;
const COLS = 4;
const TOTAL = ROWS * COLS;

const CELL_MIN = { xs: 84, sm: 102, md: 118 };

// ===== “SQL Slayers” board =====
// Internal truth: kind = "risky" should be popped; kind = "safe" should be left alone.
// UI must NOT show kind.
const ITEMS = [
  // ✅ RISKY (should be popped)
  {
    kind: "risky",
    title: "Prod DSN / Connection String",
    text: "Here’s the prod Postgres DSN (user/password included). Write a query to pull customers.",
    why: "Credentials and connection strings are secrets. Never paste them into prompts.",
  },
  {
    kind: "risky",
    title: "Warehouse Private Key",
    text: "This is our Snowflake private key. Use it to run an export.",
    why: "Keys/tokens grant access. Treat them like passwords.",
  },
  {
    kind: "risky",
    title: "Customer Export",
    text: "Use this export (emails + addresses) to segment users for a campaign.",
    why: "Customer PII doesn’t belong in prompts. Use aggregates, redactions, or synthetic samples.",
  },
  {
    kind: "risky",
    title: "Access Token",
    text: "Bearer token: eyJhbGciOi... Call the API and summarize the response.",
    why: "Access tokens are sensitive and can be abused if leaked.",
  },
  {
    kind: "risky",
    title: "Internal Revenue by Property",
    text: "Here are non-public revenue numbers by property. Find weaknesses we can exploit.",
    why: "Non-public internal financial data is confidential. Keep it out of prompts.",
  },
  {
    kind: "risky",
    title: "Private Contract / Legal Doc",
    text: "Here’s a private vendor contract. Extract negotiation leverage and hidden risks.",
    why: "Confidential legal/commercial documents shouldn’t be pasted into prompts.",
  },

  // ✅ SAFE (should be left alone)
  {
    kind: "safe",
    title: "Schema + Requirement",
    text: "Given tables Orders(order_id, user_id, total) + Users(user_id, created_at), write SQL for monthly revenue.",
    why: "High-level requirements + schema info is fine (no secrets, no PII).",
  },
  {
    kind: "safe",
    title: "Synthetic Sample Rows",
    text: "Use this fake data: user_id=123, created_at=2026-01-01. Draft a query that groups by week.",
    why: "Synthetic/mock data is a safe way to get help without exposing real data.",
  },
  {
    kind: "safe",
    title: "Explain a Query Plan (Redacted)",
    text: "Explain this EXPLAIN output and suggest indexing (no table names or sensitive fields).",
    why: "Performance tuning questions are safe when sensitive details are omitted.",
  },
  {
    kind: "safe",
    title: "Parameterized Query Best Practices",
    text: "How do I avoid SQL injection when building queries from user inputs?",
    why: "General secure coding guidance is safe to ask for.",
  },
  {
    kind: "safe",
    title: "Public Documentation Link",
    text: "Summarize this public Postgres docs page and key takeaways.",
    why: "Public information is generally safe to reference.",
  },
  {
    kind: "safe",
    title: "Non-sensitive Code Review",
    text: "Review this SQL query for readability and correctness (no credentials, no customer data).",
    why: "General code snippets are typically fine if they don’t include secrets or PII.",
  },
];

function uid(prefix = "b") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ✅ Guarantee a winnable board: half risky, half clean (or as close as possible)
function buildBoard() {
  const riskyPool = ITEMS.filter((x) => x.kind === "risky");
  const safePool = ITEMS.filter((x) => x.kind === "safe");

  const riskyCount = Math.min(Math.floor(TOTAL / 2), riskyPool.length);
  const safeCount = Math.min(TOTAL - riskyCount, safePool.length);

  const pickedRisky = shuffle(riskyPool).slice(0, riskyCount);
  const pickedSafe = shuffle(safePool).slice(0, safeCount);

  // If pools are uneven, backfill from whatever remains (still fine; kind stays hidden)
  const remainderNeeded = TOTAL - (pickedRisky.length + pickedSafe.length);
  const remainderPool = shuffle(
    ITEMS.filter(
      (x) =>
        !pickedRisky.includes(x) &&
        !pickedSafe.includes(x)
    )
  ).slice(0, Math.max(0, remainderNeeded));

  const picked = shuffle([...pickedRisky, ...pickedSafe, ...remainderPool]).slice(0, TOTAL);

  return picked.map((it) => ({
    id: uid("balloon"),
    ...it,
    popped: false,
    hit: false,  // popped “bad” input
    miss: false, // popped “clean” input (false positive)
  }));
}

export default function BalloonDartAct({ module, answer, onComplete }) {
  const reduce = useReducedMotion();

  const [board, setBoard] = React.useState([]);
  const [armed, setArmed] = React.useState(false);

  const [hits, setHits] = React.useState(0);
  const [misses, setMisses] = React.useState(0);

  const [feedback, setFeedback] = React.useState(null);
  const [pulse, setPulse] = React.useState(0);

  const [victoryOpen, setVictoryOpen] = React.useState(false);

  React.useEffect(() => {
    setBoard(buildBoard());
  }, []);

  const requiredRisky = React.useMemo(
    () => board.filter((b) => b.kind === "risky").length,
    [board]
  );

  // Win when all risky are popped (we don’t need to require 0 misses unless you want “perfect run”)
  const complete = requiredRisky > 0 && hits >= requiredRisky;

  React.useEffect(() => {
    if (complete) setVictoryOpen(true);
  }, [complete]);

  function reset() {
    setBoard(buildBoard());
    setArmed(false);
    setHits(0);
    setMisses(0);
    setFeedback(null);
    setPulse(0);
    setVictoryOpen(false);
  }

  function finishStamp() {
  const payload = {
    type: "balloon_dart_v1",
    completed: true,
    hits,
    misses,
    requiredRisky,
    completedAt: Date.now(),
  };

  // ✅ Stamp ticket (WorkshopClient will persist + award)
  onComplete?.(payload);

  // ✅ Close the success popup so the player sees progress update
  setVictoryOpen(false);

  // ✅ Optional: visible confirmation (feels responsive)
  setFeedback({ type: "success", text: "🎟️ Ticket stamped. Prize ticket awarded." });
  setPulse((p) => p + 1);
}

  function onDragStartDart(e) {
    e.dataTransfer.setData("text/plain", "dart");
    e.dataTransfer.effectAllowed = "copy";
  }

  function tryPop(targetId) {
    setBoard((prev) => {
      const t = prev.find((x) => x.id === targetId);
      if (!t || t.popped) return prev;

      const isHit = t.kind === "risky";  // ✅ internal only
      const isMiss = t.kind === "safe";

      if (isHit) {
        setHits((h) => h + 1);
        setFeedback({ type: "success", text: `🎯 Patched: ${t.title}` });
      } else {
        setMisses((m) => m + 1);
        setPulse((p) => p + 1);
        setFeedback({ type: "warning", text: `💥 False positive: ${t.title}` });
      }

      return prev.map((x) =>
        x.id === targetId
          ? { ...x, popped: true, hit: isHit, miss: isMiss }
          : x
      );
    });
  }

  function onDropBalloon(e, id) {
    e.preventDefault();
    const payload = e.dataTransfer.getData("text/plain");
    if (payload !== "dart") return;
    tryPop(id);
  }

  function onClickBalloon(id) {
    if (!armed) return;
    tryPop(id);
    setArmed(false);
  }

  return (
    <Stack spacing={1.6} sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Victory Overlay */}
      <AnimatePresence>
        {victoryOpen ? (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 2600,
              backgroundColor: "rgba(0,0,0,0.74)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            <MotionBox
              initial={reduce ? { scale: 1, y: 0 } : { scale: 0.86, y: 14 }}
              animate={reduce ? { scale: 1, y: 0 } : { scale: 1, y: 0 }}
              transition={
                reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 18 }
              }
              sx={{
                width: "100%",
                maxWidth: 720,
                borderRadius: 3,
                overflow: "hidden",
                border: "2px dashed rgba(255,255,255,0.22)",
                boxShadow: "0 22px 70px rgba(0,0,0,0.65)",
                backgroundColor: "rgba(18,10,12,0.94)",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ p: 2.2, borderBottom: "1px dashed rgba(255,255,255,0.16)" }}>
                <Typography
                  sx={{
                    fontWeight: 950,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "rgba(250,204,21,0.95)",
                  }}
                >
                  CLEAN RUN • DATA SAFE • 🎈
                </Typography>
              </Box>

              <Box sx={{ p: 2.5, overflowY: "auto" }}>
                <Typography variant="h5" fontWeight={950} sx={{ mb: 0.75 }}>
                  Prompt Hygiene Cleared
                </Typography>
                <Typography sx={{ opacity: 0.9, lineHeight: 1.55 }}>
                  You patched the leaks and learned what stays out of the prompt.
                </Typography>

                <Paper
                  sx={{
                    mt: 2,
                    p: 1.6,
                    borderRadius: 2,
                    border: "1px dashed rgba(34,197,94,0.35)",
                    backgroundColor: "rgba(34,197,94,0.08)",
                  }}
                >
                  <Stack direction="row" spacing={1.2} sx={{ flexWrap: "wrap" }}>
                    <Chip
                      label={`Leaks patched: ${hits}/${requiredRisky}`}
                      sx={{ backgroundColor: "rgba(0,0,0,0.20)" }}
                    />
                    <Chip
                      label={`False positives: ${misses}`}
                      sx={{ backgroundColor: "rgba(0,0,0,0.20)" }}
                    />
                  </Stack>
                </Paper>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2.2 }}>
                  <Button
                    variant="contained"
                    onClick={finishStamp}
                    sx={{
                      borderRadius: 999,
                      px: 3,
                      backgroundImage:
                        "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
                    }}
                  >
                    Stamp Ticket
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => setVictoryOpen(false)}
                    sx={{
                      borderRadius: 999,
                      px: 3,
                      borderStyle: "dashed",
                      borderColor: "rgba(255,255,255,0.35)",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    Keep practicing
                  </Button>
                </Stack>
              </Box>
            </MotionBox>
          </MotionBox>
        ) : null}
      </AnimatePresence>

      {/* Header (title is SR-only; page shell can own the visible H4) */}
<Stack spacing={0.3}>
  <Typography
    component="h2"
    variant="h4"
    sx={{
      position: "absolute",
      width: 1,
      height: 1,
      p: 0,
      m: -1,
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: 0,
    }}
  >
    {module?.title ?? "What’s Safe to Put in a Prompt?"}
  </Typography>

  <Typography sx={{ opacity: 0.85 }}>
    SQL Slayers: patch the leaks. Hover balloons to read the prompt snippet.
  </Typography>

  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} alignItems="center">
    <Chip
      label={`Leaks patched: ${hits}/${requiredRisky || "—"}`}
      sx={{
        backgroundColor: "rgba(0,0,0,0.28)",
        border: "1px dashed rgba(255,255,255,0.22)",
      }}
    />
    <Chip
      label={`False positives: ${misses}`}
      sx={{
        backgroundColor: "rgba(0,0,0,0.28)",
        border: "1px dashed rgba(255,255,255,0.22)",
      }}
    />
    <Button
      variant="outlined"
      onClick={reset}
      sx={{
        borderRadius: 999,
        borderStyle: "dashed",
        borderColor: "rgba(225,29,72,0.55)",
        color: "rgba(255,255,255,0.9)",
      }}
    >
      Reset
    </Button>
  </Stack>
</Stack>

      {/* Feedback */}
      <AnimatePresence>
        {feedback ? (
          <MotionBox
            key={`${feedback.type}-${pulse}`}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
          >
            <Alert severity={feedback.type}>{feedback.text}</Alert>
          </MotionBox>
        ) : null}
      </AnimatePresence>

      {/* Balloon Wall */}
      <Paper
        sx={{
          width: "100%",
          p: 1.2,
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.18)",
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 0.8 }}>
          Balloon Wall (3 × 4)
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, minmax(${CELL_MIN.xs}px, 1fr))`,
            gap: { xs: 1, sm: 1.2 },
            "@media (min-width:600px)": {
              gridTemplateColumns: `repeat(${COLS}, minmax(${CELL_MIN.sm}px, 1fr))`,
            },
            "@media (min-width:900px)": {
              gridTemplateColumns: `repeat(${COLS}, minmax(${CELL_MIN.md}px, 1fr))`,
            },
          }}
        >
          {board.map((b) => {
            // ✅ No kind-based styling before pop
            const border = b.popped
              ? b.hit
                ? "2px dashed rgba(34,197,94,0.70)"
                : "2px dashed rgba(225,29,72,0.70)"
              : "2px dashed rgba(255,255,255,0.18)";

            return (
              <Tooltip
                key={b.id}
                title={
                  <Box sx={{ p: 0.6, maxWidth: 520 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 12, mb: 0.5, opacity: 0.95 }}>
                      {b.title}
                    </Typography>
                    <Typography sx={{ fontSize: 12, opacity: 0.92, whiteSpace: "pre-wrap" }}>
                      {b.text}
                    </Typography>

                    {/* ✅ Reveal “why” only after interaction */}
                    {b.popped ? (
                      <Typography sx={{ fontSize: 12, opacity: 0.75, mt: 0.7 }}>
                        {b.why}
                      </Typography>
                    ) : null}
                  </Box>
                }
                arrow
                placement="top"
                enterDelay={120}
              >
                <MotionBox
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropBalloon(e, b.id)}
                  onClick={() => onClickBalloon(b.id)}
                  animate={
                    !reduce && b.miss
                      ? { rotate: [0, -2, 2, -1, 1, 0], x: [0, -5, 5, -3, 3, 0] }
                      : { rotate: 0, x: 0 }
                  }
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "crosshair",
                    border,
                    backgroundColor: "rgba(0,0,0,0.10)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
                    aspectRatio: "1 / 1",
                    opacity: b.popped ? 0.78 : 1,
                  }}
                >
                  <Image
                    src={BALLOON_IMG_SRC}
                    alt="Balloon"
                    fill
                    sizes="140px"
                    style={{ objectFit: "contain" }}
                  />

                  {/* Neutral label (no kind leak) */}
                  <Box sx={{ position: "absolute", left: 6, top: 6 }}>
                    <Chip
                      size="small"
                      label={b.title}
                      sx={{
                        height: 22,
                        maxWidth: 140,
                        backgroundColor: "rgba(0,0,0,0.40)",
                        border: "1px dashed rgba(255,255,255,0.22)",
                        color: "rgba(255,255,255,0.92)",
                        "& .MuiChip-label": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      }}
                    />
                  </Box>

                  {/* Outcome (only after pop) */}
                  {b.popped ? (
                    <Box sx={{ position: "absolute", right: 6, top: 6 }}>
                      <Chip
                        size="small"
                        label={b.hit ? "PATCHED" : "FALSE POSITIVE"}
                        sx={{
                          height: 22,
                          backgroundColor: b.hit
                            ? "rgba(34,197,94,0.18)"
                            : "rgba(225,29,72,0.16)",
                          border: b.hit
                            ? "1px solid rgba(34,197,94,0.35)"
                            : "1px solid rgba(225,29,72,0.35)",
                        }}
                      />
                    </Box>
                  ) : null}
                </MotionBox>
              </Tooltip>
            );
          })}
        </Box>

        <Typography sx={{ mt: 1, fontSize: 12, opacity: 0.7 }}>
          Hover a balloon to read its prompt snippet. Patch the leaks with the dart.
        </Typography>
      </Paper>

      {/* Sticky Dart Bar */}
      <Paper
        sx={{
          position: "sticky",
          bottom: 10,
          zIndex: 20,
          p: 1.1,
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.30)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Box
              draggable
              onDragStart={onDragStartDart}
              onClick={() => setArmed((a) => !a)}
              sx={{
                width: 112,
                height: 52,
                borderRadius: 2,
                position: "relative",
                cursor: "grab",
                userSelect: "none",
                border: armed
                  ? "2px dashed rgba(250,204,21,0.75)"
                  : "2px dashed rgba(255,255,255,0.22)",
                backgroundColor: "rgba(0,0,0,0.20)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                "&:active": { cursor: "grabbing" },
              }}
            >
              <Image
                src={DART_IMG_SRC}
                alt="Dart"
                fill
                sizes="112px"
                style={{ objectFit: "contain" }}
              />
            </Box>

            <Box>
              <Typography fontWeight={950} sx={{ opacity: 0.95 }}>
                Dart
              </Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
                Drag onto a balloon. (Mobile: tap dart to arm, then tap a balloon.)
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Chip
              label={
                complete
                  ? "All leaks patched"
                  : `Leaks remaining: ${Math.max(0, requiredRisky - hits)}`
              }
              sx={{
                backgroundColor: "rgba(0,0,0,0.28)",
                border: "1px dashed rgba(250,204,21,0.35)",
              }}
            />
            {armed ? (
              <Chip
                label="Armed"
                sx={{
                  backgroundColor: "rgba(250,204,21,0.10)",
                  border: "1px dashed rgba(250,204,21,0.45)",
                }}
              />
            ) : null}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}