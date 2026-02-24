"use client";

import * as React from "react";
import { Box, Stack, Typography, Button, Chip, Divider } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const BOW_TOSS = {
  title: "Goldfish Bowl Toss",
  intro:
    "Sort prompts into the right bowl: Bad, Better, Great. You’re training your eye for what makes outputs reliable.",
  // ✅ Leave room for art: you can replace this Box with Image later
  artHint: "Drop carnival art here later.",
  bowls: [
    { id: "bad", label: "Bad", helper: "Vague, missing constraints", ring: "🥴" },
    { id: "better", label: "Better", helper: "Some context + intent", ring: "🙂" },
    { id: "great", label: "Great", helper: "Context + constraints + format", ring: "🏆" },
  ],
  cards: [
    {
      id: "c1",
      correct: "bad",
      text: "Write an email about our product.",
      why: "No audience, no goal, no tone, no CTA.",
    },
    {
      id: "c2",
      correct: "bad",
      text: "Summarize this for me.",
      why: "No format, no length, no purpose; output varies wildly.",
    },
    {
      id: "c3",
      correct: "better",
      text: "Write a friendly email announcing a new feature to customers.",
      why: "Adds audience + tone; still missing key constraints and structure.",
    },
    {
      id: "c4",
      correct: "better",
      text: "Summarize this in 5 bullets for a busy exec.",
      why: "Adds format + audience; still missing scope/what to prioritize.",
    },
    {
      id: "c5",
      correct: "great",
      text:
        "You are a marketing copywriter. Draft a 120–150 word email to existing customers announcing Feature X. Tone: upbeat, confident. Include 1 CTA button label. Avoid hypey claims. Output: Subject, Preheader, Body, CTA.",
      why: "Role + length + tone + structure + constraints = stable output.",
    },
    {
      id: "c6",
      correct: "great",
      text:
        "Act as a technical writer. Summarize the following doc focusing on: risks, decisions, and next steps. Output exactly: 5 bullets + a 1-sentence summary. If info is missing, say 'Unknown'.",
      why: "Defines priorities, format, and how to handle uncertainty.",
    },
  ],
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function findCard(id) {
  return BOW_TOSS.cards.find((c) => c.id === id) || null;
}

function computeScore(placements) {
  let total = 0;
  let correct = 0;

  for (const bowl of BOW_TOSS.bowls) {
    const ids = placements[bowl.id] || [];
    for (const id of ids) {
      total += 1;
      const card = findCard(id);
      if (card?.correct === bowl.id) correct += 1;
    }
  }

  return { total, correct, pct: total ? Math.round((correct / total) * 100) : 0 };
}

export default function GoldfishBowlTossAct({ value, onComplete }) {
  const reduce = useReducedMotion();

  const initial = React.useMemo(() => {
    // value can be persisted answer object; if present, hydrate it
    const v = value && typeof value === "object" ? value : null;
    const placements =
      v?.placements && typeof v.placements === "object"
        ? v.placements
        : { bad: [], better: [], great: [] };

    // Ensure every bowl key exists
    for (const b of BOW_TOSS.bowls) placements[b.id] = placements[b.id] || [];

    // Bank is whatever isn't placed yet
    const placed = new Set(
      Object.values(placements).flatMap((arr) => (Array.isArray(arr) ? arr : []))
    );

    const bank = BOW_TOSS.cards.map((c) => c.id).filter((id) => !placed.has(id));

    return { placements, bank };
  }, [value]);

  const [placements, setPlacements] = React.useState(initial.placements);
  const [bank, setBank] = React.useState(initial.bank);

  // click fallback
  const [armedId, setArmedId] = React.useState(null);

  const { total, correct, pct } = React.useMemo(
    () => computeScore(placements),
    [placements]
  );

  const allPlaced = total === BOW_TOSS.cards.length;
  const isStamped = Boolean(value);

  const moveCard = React.useCallback((cardId, bowlId) => {
    setPlacements((prev) => {
      const next = {
        bad: [...(prev.bad || [])],
        better: [...(prev.better || [])],
        great: [...(prev.great || [])],
      };

      // remove from any bowl
      for (const b of BOW_TOSS.bowls) {
        next[b.id] = (next[b.id] || []).filter((x) => x !== cardId);
      }

      // add to target bowl
      next[bowlId] = [...(next[bowlId] || []), cardId];

      return next;
    });

    setBank((prev) => prev.filter((x) => x !== cardId));
    setArmedId(null);
  }, []);

  const returnToBank = React.useCallback((cardId) => {
    setPlacements((prev) => {
      const next = { ...prev };
      for (const b of BOW_TOSS.bowls) {
        next[b.id] = (next[b.id] || []).filter((x) => x !== cardId);
      }
      return next;
    });

    setBank((prev) => (prev.includes(cardId) ? prev : [cardId, ...prev]));
    setArmedId(null);
  }, []);

  const handleDrop = (e, bowlId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain");
    if (!cardId) return;
    moveCard(cardId, bowlId);
  };

  const stamp = () => {
    if (!allPlaced) return;

    const payload = {
      type: "bow_toss",
      placements,
      score: { total, correct, pct },
      completedAt: Date.now(),
    };

    onComplete?.(payload);
  };

  return (
    <Stack spacing={2.5}>
      <Typography sx={{ opacity: 0.92 }}>{BOW_TOSS.intro}</Typography>

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
        <Typography fontWeight={950}>🎨 Goldfish Toss Art Slot</Typography>
        <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{BOW_TOSS.artHint}</Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} alignItems="center">
        <Chip
          label={`Placed: ${total}/${BOW_TOSS.cards.length}`}
          sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.18)" }}
        />
        <Chip
          label={`Accuracy: ${pct}%`}
          sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(250,204,21,0.22)" }}
        />
        {armedId ? (
          <Chip
            label={`Armed: ${armedId}`}
            sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(225,29,72,0.35)" }}
          />
        ) : null}
      </Stack>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

      {/* BOWLS */}
      <GridLike>
        {BOW_TOSS.bowls.map((bowl) => {
          const ids = placements[bowl.id] || [];

          return (
            <DropZone
              key={bowl.id}
              label={`${bowl.ring} ${bowl.label}`}
              helper={bowl.helper}
              onDrop={(e) => handleDrop(e, bowl.id)}
              onClick={() => armedId && moveCard(armedId, bowl.id)}
              reduce={reduce}
            >
              <Stack spacing={1}>
                {ids.map((id) => {
                  const card = findCard(id);
                  const isCorrect = card?.correct === bowl.id;
                  return (
                    <PromptCard
                      key={id}
                      id={id}
                      text={card?.text}
                      tone={isCorrect ? "good" : "bad"}
                      onReturn={() => returnToBank(id)}
                    />
                  );
                })}
              </Stack>
            </DropZone>
          );
        })}
      </GridLike>

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
          Toss Queue (drag or click → then click a bowl)
        </Typography>

        <Stack spacing={1}>
          {bank.map((id) => {
            const card = findCard(id);
            const armed = armedId === id;

            return (
              <PromptCard
                key={id}
                id={id}
                text={card?.text}
                tone={armed ? "armed" : "neutral"}
                onArm={() => setArmedId(armed ? null : id)}
              />
            );
          })}
        </Stack>
      </Box>

      {/* EXPLAINER */}
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
            Why it matters
          </Typography>
          <Typography sx={{ opacity: 0.88 }}>
            **Great prompts** reduce variance by adding context, constraints, and output format.
            They don’t remove your responsibility — they make your responsibility easier to fulfill.
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
          backgroundImage:
            "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
          opacity: allPlaced ? 1 : 0.55,
        }}
      >
        {isStamped ? "Re-stamp (no extra tickets)" : "Ring Bell & Stamp Ticket"}
      </Button>
    </Stack>
  );
}

function GridLike({ children }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

function DropZone({ label, helper, onDrop, onClick, children, reduce }) {
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

function PromptCard({ id, text, tone = "neutral", onReturn, onArm }) {
  const border =
    tone === "good"
      ? "rgba(250,204,21,0.55)"
      : tone === "bad"
      ? "rgba(225,29,72,0.55)"
      : tone === "armed"
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
        backgroundColor: "rgba(0,0,0,0.16)",
        userSelect: "none",
      }}
    >
      <Typography sx={{ opacity: 0.9, fontSize: 13 }}>{text}</Typography>

      {onReturn ? (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onReturn();
          }}
          size="small"
          variant="text"
          sx={{ mt: 0.5, opacity: 0.8 }}
        >
          Return
        </Button>
      ) : null}
    </Box>
  );
}