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
  Divider,
} from "@mui/material";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const TARGET_IMG_SRC = "/target.png"; // ✅ in /public
const TOTAL_TARGETS = 30;
const ROWS = 3;
const COLS = 10;

// --- Seed: Ambassador renewal (EN) ---
// (You can swap this later to a casefile import once you formalize it.)
const AMBASSADOR_SEED = {
  subject: "[Fname], you’ve renewed your Ambassador Elite status",
  preheader: "Continue to enjoy your Elite benefits.",
  hero: "Congratulations, [Fname]! You’ve renewed your Ambassador Elite status.",
  expiry: "February 28, 2027",
  benefits: ["Ambassador Service", "Enhanced Room Upgrades", "Your24™ flexibility"],
  primaryCta: "Explore Benefits",
  secondary: {
    prefsHeadline:
      "Personalize your travel preferences so your personal Ambassador can learn more about you and your travel style.",
    prefsCta: "Update Your Preferences",
  },
};

function uid(prefix = "t") {
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

const GOOD_SEQUENCE = [
  {
    id: "role",
    title: "Role",
    text: "You are a senior CRM email copywriter for Marriott Bonvoy. Write premium, member-first copy.",
  },
  {
    id: "audience_goal",
    title: "Audience + Goal",
    text: "Audience: member who renewed Ambassador Elite. Goal: congratulate + reinforce benefits + drive a click.",
  },
  {
    id: "facts",
    title: "Facts Only",
    text:
      "Use ONLY these facts (no invention):\n" +
      `Subject: ${AMBASSADOR_SEED.subject}\n` +
      `Preheader: ${AMBASSADOR_SEED.preheader}\n` +
      `Hero: ${AMBASSADOR_SEED.hero}\n` +
      `Renewed through: ${AMBASSADOR_SEED.expiry}\n` +
      `Benefits:\n- ${AMBASSADOR_SEED.benefits.join("\n- ")}\n` +
      `Primary CTA: ${AMBASSADOR_SEED.primaryCta}\n` +
      `Prefs module: ${AMBASSADOR_SEED.secondary.prefsHeadline} / ${AMBASSADOR_SEED.secondary.prefsCta}`,
  },
  {
    id: "tone",
    title: "Tone",
    text: "Tone: warm, premium, confident. Short sentences. No hype. No fluff.",
  },
  {
    id: "constraints",
    title: "Constraints",
    text: "Constraints: Do not invent benefits/dates/offers. Keep subject ≤ 60 chars, preheader ≤ 90 chars.",
  },
  {
    id: "structure",
    title: "Structure",
    text: "Structure: Subject, Preheader, Hero, 3 benefit bullets, Primary CTA, Preferences module.",
  },
  {
    id: "format",
    title: "Output Format",
    text:
      "Return JSON keys: subject, preheader, hero, benefits[], primaryCta, secondary.prefs.headline, secondary.prefs.cta.",
  },
  {
    id: "self_check",
    title: "Self-check",
    text: "Before output: verify every claim is supported by the facts block. If not, remove it.",
  },
  {
    id: "final",
    title: "Final Instruction",
    text: "Write the email now.",
  },
];

// 30 total targets. If we have 9 good steps, fill the rest with decoys.
const DECOYS = [
  { title: "Decoy", text: "Write a nice email about this." },
  { title: "Decoy", text: "Make it super exciting and add whatever you think helps." },
  { title: "Decoy", text: "Just write something convincing. Don’t worry about facts." },
  { title: "Decoy", text: "Ask the member for their passport number to verify status." },
  { title: "Decoy", text: "Include a limited-time discount offer (invent one if needed)." },
  { title: "Decoy", text: "Use a long, detailed paragraph explaining every benefit in depth." },
  { title: "Decoy", text: "Return HTML with inline CSS and tracking pixels." },
  { title: "Decoy", text: "Search the internet for the latest benefits and include them." },
  { title: "Decoy", text: "Use slang and jokes to be more relatable." },
  { title: "Decoy", text: "Make the subject line ALL CAPS for maximum attention." },
  { title: "Decoy", text: "Keep it vague so it works for anyone." },
  { title: "Decoy", text: "Ignore character limits." },
  { title: "Decoy", text: "Ask the user for their full address and phone number." },
  { title: "Decoy", text: "Mix tasks: summarize, rewrite, translate, and sell at the same time." },
  { title: "Decoy", text: "Don’t include a CTA. Let them figure it out." },
  { title: "Decoy", text: "Include 8–10 benefit bullets to show value." },
  { title: "Decoy", text: "Use emojis everywhere to boost engagement." },
  { title: "Decoy", text: "Return only the hero and nothing else." },
  { title: "Decoy", text: "Use random personalization variables you think might exist." },
  { title: "Decoy", text: "Ask the member to reply with their account number." },
  { title: "Decoy", text: "Make up a renewal date if it’s missing." },
];

function buildBoard() {
  // Place GOOD_SEQUENCE across the board, but keep the *required order* by sequenceIndex.
  const goodTargets = GOOD_SEQUENCE.map((s, idx) => ({
    id: uid("good"),
    kind: "good",
    sequenceIndex: idx,
    title: s.title,
    text: s.text,
    hit: false,
    miss: false,
  }));

  const needDecoys = Math.max(0, TOTAL_TARGETS - goodTargets.length);
  const decoyTargets = Array.from({ length: needDecoys }).map((_, i) => {
    const d = DECOYS[i % DECOYS.length];
    return {
      id: uid("decoy"),
      kind: "decoy",
      sequenceIndex: null,
      title: d.title,
      text: d.text,
      hit: false,
      miss: false,
    };
  });

  // Shuffle positions so the correct ones are “hidden” among decoys.
  return shuffle([...goodTargets, ...decoyTargets]).slice(0, TOTAL_TARGETS);
}

function buildPromptFromHits(board) {
  // Sort by sequenceIndex and concatenate the good hits in correct order.
  const goodHits = board
    .filter((t) => t.kind === "good" && t.hit)
    .sort((a, b) => (a.sequenceIndex ?? 0) - (b.sequenceIndex ?? 0));

  return goodHits.map((t) => t.text).join("\n\n");
}

function mockGenerateEmail(prompt) {
  // Minimal “AI draft” mock: we just show JSON-ish output if prompt looks structured.
  const wantsJson = /Return JSON|JSON keys|Return JSON keys/i.test(prompt);
  const looksStrict =
    /Use ONLY these facts/i.test(prompt) &&
    /Constraints/i.test(prompt) &&
    /Structure/i.test(prompt);

  if (!looksStrict) {
    return wantsJson
      ? {
          subject: "[Fname], congratulations!",
          preheader: "",
          hero: "Congrats!",
          benefits: ["Great perks", "Rewards", "Upgrades"],
          primaryCta: "Learn More",
          secondary: { prefs: { headline: "Stay in the know", cta: "Update preferences" } },
          _note: "Generic draft (prompt lacked facts/constraints/structure).",
        }
      : "Generic draft generated (prompt too vague).";
  }

  const seed = AMBASSADOR_SEED;
  return wantsJson
    ? {
        subject: seed.subject,
        preheader: seed.preheader,
        hero: seed.hero,
        benefits: seed.benefits,
        primaryCta: seed.primaryCta,
        secondary: { prefs: { headline: seed.secondary.prefsHeadline, cta: seed.secondary.prefsCta } },
      }
    : `Subject: ${seed.subject}
Preheader: ${seed.preheader}

${seed.hero}

Benefits:
- ${seed.benefits.join("\n- ")}

Primary CTA: ${seed.primaryCta}

Preferences:
${seed.secondary.prefsHeadline}
CTA: ${seed.secondary.prefsCta}`;
}

export default function EmailShootingGalleryAct({ module, answer, onComplete }) {
  const reduce = useReducedMotion();

  const [board, setBoard] = React.useState(() => buildBoard());
  const [nextIdx, setNextIdx] = React.useState(0);

  const [armed, setArmed] = React.useState(false); // tap fallback
  const [hits, setHits] = React.useState(0);
  const [misses, setMisses] = React.useState(0);

  const [feedback, setFeedback] = React.useState(null);
  const [wrongPulse, setWrongPulse] = React.useState(0);
  const [victoryOpen, setVictoryOpen] = React.useState(false);

  const [draft, setDraft] = React.useState(null);

  const prompt = React.useMemo(() => buildPromptFromHits(board), [board]);
  const requiredTotal = GOOD_SEQUENCE.length;
  const progress = Math.min(requiredTotal, nextIdx);

  const complete = progress >= requiredTotal;

  function reset() {
    setBoard(buildBoard());
    setNextIdx(0);
    setHits(0);
    setMisses(0);
    setFeedback(null);
    setWrongPulse(0);
    setVictoryOpen(false);
    setDraft(null);
    setArmed(false);
  }

  function fireAI() {
    const out = mockGenerateEmail(prompt);
    setDraft(out);

    // win condition: all correct in order (complete) + generated
    if (complete) {
      setFeedback(null);
      setVictoryOpen(true);
    } else {
      setFeedback({
        type: "info",
        text: "Draft generated — but your prompt isn’t complete yet. Keep shooting the correct targets in order.",
      });
    }
  }

  function finishStamp() {
    const payload = {
      type: "shooting_gallery_targets",
      completed: true,
      hits,
      misses,
      nextIdx,
      prompt,
      draft,
      completedAt: Date.now(),
    };
    onComplete?.(payload);
  }

  function onDragStartBullet(e) {
    e.dataTransfer.setData("text/plain", "bullet");
    e.dataTransfer.effectAllowed = "copy";
  }

  function tryHitTarget(targetId) {
    setBoard((prev) => {
      const t = prev.find((x) => x.id === targetId);
      if (!t) return prev;

      // already hit? ignore
      if (t.hit) return prev;

      const isCorrect = t.kind === "good" && t.sequenceIndex === nextIdx;

      if (isCorrect) {
        setHits((h) => h + 1);
        setFeedback({ type: "success", text: `🎯 Bullseye: ${t.title}` });

        const next = prev.map((x) =>
          x.id === targetId ? { ...x, hit: true, miss: false } : x
        );

        // advance step
        setNextIdx((n) => n + 1);

        return next;
      }

      // wrong: decoy, or correct snippet but out-of-order
      setMisses((m) => m + 1);
      setWrongPulse((n) => n + 1);

      const reason =
        t.kind === "good"
          ? "Out of order. Build the prompt step-by-step."
          : "Decoy. Vague/unsafe prompt part.";

      setFeedback({ type: "warning", text: `💥 CLUNK. ${reason}` });

      return prev.map((x) =>
        x.id === targetId ? { ...x, miss: true } : x
      );
    });
  }

  function onDropTarget(e, targetId) {
    e.preventDefault();
    const payload = e.dataTransfer.getData("text/plain");
    if (payload !== "bullet") return;
    tryHitTarget(targetId);
  }

  function onClickTarget(targetId) {
    // Mobile/touch fallback: tap bullet to arm, then tap a target
    if (!armed) return;
    tryHitTarget(targetId);
    setArmed(false);
  }

  return (
    <Stack spacing={2.2}>
      {/* Victory Overlay (fixed) */}
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
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 18 }}
              sx={{
                width: "100%",
                maxWidth: 680,
                borderRadius: 3,
                overflow: "hidden",
                border: "2px dashed rgba(255,255,255,0.22)",
                boxShadow: "0 22px 70px rgba(0,0,0,0.65)",
                backgroundColor: "rgba(18,10,12,0.94)",
                backgroundImage: `
                  radial-gradient(900px 440px at 30% 0%, rgba(250,204,21,0.24), transparent 60%),
                  radial-gradient(900px 440px at 80% 20%, rgba(225,29,72,0.24), transparent 60%)
                `,
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
                  BULLSEYE • PROMPT COMPLETE • 🎯
                </Typography>
              </Box>

              <Box sx={{ p: 2.5 }}>
                <Typography variant="h5" fontWeight={950} sx={{ mb: 0.75 }}>
                  Shooting Gallery Cleared
                </Typography>

                <Typography sx={{ opacity: 0.9, lineHeight: 1.55 }}>
                  You built the prompt in the correct order — and generated a clean email draft.
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
                    <Chip label={`Hits: ${hits}`} sx={{ backgroundColor: "rgba(0,0,0,0.20)" }} />
                    <Chip label={`Misses: ${misses}`} sx={{ backgroundColor: "rgba(0,0,0,0.20)" }} />
                    <Chip label={`Steps: ${requiredTotal}/${requiredTotal}`} sx={{ backgroundColor: "rgba(0,0,0,0.20)" }} />
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
                    Keep playing
                  </Button>
                </Stack>
              </Box>
            </MotionBox>
          </MotionBox>
        ) : null}
      </AnimatePresence>

      {/* Header */}
      <Stack spacing={0.5}>
        <Typography variant="h4">{module?.title ?? "Shooting Gallery"}</Typography>
        <Typography sx={{ opacity: 0.85 }}>
          Shoot the correct prompt parts <b>in order</b> to build the prompt that builds the email.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} alignItems="center">
          <Chip
            label={`Progress: ${progress}/${requiredTotal}`}
            sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.22)" }}
          />
          <Chip
            label={`Hits: ${hits}`}
            sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.22)" }}
          />
          <Chip
            label={`Misses: ${misses}`}
            sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.22)" }}
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
            key={`${feedback.type}-${wrongPulse}`}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
          >
            <Alert severity={feedback.type}>{feedback.text}</Alert>
          </MotionBox>
        ) : null}
      </AnimatePresence>

      {/* Bullet + FIRE controls */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.18)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.4} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            {/* Drag bullet */}
            <Paper
              draggable
              onDragStart={onDragStartBullet}
              onClick={() => setArmed((a) => !a)}
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                cursor: "grab",
                userSelect: "none",
                border: armed ? "2px dashed rgba(250,204,21,0.75)" : "2px dashed rgba(255,255,255,0.22)",
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(250,204,21,0.25) 50%, rgba(0,0,0,0.12))",
                boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                "&:active": { cursor: "grabbing" },
              }}
            >
              <Typography sx={{ fontSize: 24, lineHeight: 1 }}>🔫</Typography>
            </Paper>

            <Box>
              <Typography fontWeight={950} sx={{ opacity: 0.95 }}>
                Bullet
              </Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
                Drag onto a target. (Mobile: tap bullet to arm, then tap a target.)
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.2} alignItems="center">
            <Button
              variant="contained"
              onClick={fireAI}
              disabled={!prompt}
              sx={{
                borderRadius: 999,
                px: 3,
                backgroundImage:
                  "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
              }}
            >
              FIRE (Generate Draft)
            </Button>
            <Chip
              label={complete ? "Prompt complete" : `Next: ${GOOD_SEQUENCE[nextIdx]?.title ?? "—"}`}
              sx={{
                backgroundColor: "rgba(0,0,0,0.28)",
                border: "1px dashed rgba(250,204,21,0.35)",
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Board + Prompt + Draft */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.2} alignItems="flex-start">
        {/* Target board */}
        <Paper
          sx={{
            flex: 1,
            width: "100%",
            p: 2,
            borderRadius: 3,
            border: "2px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.18)",
            overflowX: "auto",
          }}
        >
          <Typography fontWeight={950} sx={{ mb: 1 }}>
            Target Wall (3 rows × 10)
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${COLS}, minmax(92px, 1fr))`,
              gap: 1.2,
              minWidth: 980, // keep 10-wide layout; scroll on small screens
            }}
          >
            {board.map((t) => {
              const hitGlow =
                t.hit ? "0 0 0 6px rgba(34,197,94,0.14), 0 14px 35px rgba(0,0,0,0.30)" : "0 14px 35px rgba(0,0,0,0.30)";
              const missGlow =
                t.miss ? "0 0 0 6px rgba(225,29,72,0.14), 0 14px 35px rgba(0,0,0,0.30)" : hitGlow;

              return (
                <Tooltip
                  key={t.id}
                  title={
                    <Box sx={{ p: 0.6, maxWidth: 520 }}>
                      <Typography sx={{ fontWeight: 950, fontSize: 12, mb: 0.5, opacity: 0.95 }}>
                        {t.kind === "good" ? `Correct (${t.sequenceIndex + 1}/${requiredTotal}) — ${t.title}` : "Decoy"}
                      </Typography>
                      <Typography sx={{ fontSize: 12, opacity: 0.92, whiteSpace: "pre-wrap" }}>
                        {t.text}
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                  enterDelay={150}
                >
                  <MotionBox
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropTarget(e, t.id)}
                    onClick={() => onClickTarget(t.id)}
                    animate={
                      !reduce && t.miss
                        ? { rotate: [0, -2.4, 2.4, -1.6, 1.6, 0], x: [0, -8, 8, -6, 6, 0] }
                        : { rotate: 0, x: 0 }
                    }
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    sx={{
                      position: "relative",
                      borderRadius: 2,
                      overflow: "hidden",
                      cursor: "crosshair",
                      border: t.hit
                        ? "2px dashed rgba(34,197,94,0.70)"
                        : t.miss
                        ? "2px dashed rgba(225,29,72,0.70)"
                        : "2px dashed rgba(255,255,255,0.18)",
                      backgroundColor: "rgba(0,0,0,0.10)",
                      boxShadow: missGlow,
                      aspectRatio: "1 / 1",
                    }}
                  >
                    <Image
                      src={TARGET_IMG_SRC}
                      alt="Target"
                      fill
                      sizes="120px"
                      style={{ objectFit: "contain" }}
                    />

                    {/* status chips */}
                    <Box sx={{ position: "absolute", left: 6, top: 6, display: "flex", gap: 0.6, flexWrap: "wrap" }}>
                      {t.hit ? (
                        <Chip
                          size="small"
                          label="HIT"
                          sx={{
                            height: 22,
                            backgroundColor: "rgba(34,197,94,0.18)",
                            border: "1px solid rgba(34,197,94,0.35)",
                          }}
                        />
                      ) : null}
                      {t.miss && !t.hit ? (
                        <Chip
                          size="small"
                          label="MISS"
                          sx={{
                            height: 22,
                            backgroundColor: "rgba(225,29,72,0.16)",
                            border: "1px solid rgba(225,29,72,0.35)",
                          }}
                        />
                      ) : null}
                    </Box>

                    {/* tiny hint label */}
                    <Box sx={{ position: "absolute", left: 6, right: 6, bottom: 6 }}>
                      <Typography
                        sx={{
                          fontSize: 10,
                          opacity: 0.9,
                          textShadow: "0 2px 18px rgba(0,0,0,0.45)",
                          backgroundColor: "rgba(0,0,0,0.35)",
                          border: "1px dashed rgba(255,255,255,0.16)",
                          borderRadius: 1,
                          px: 0.8,
                          py: 0.4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.title}
                      </Typography>
                    </Box>
                  </MotionBox>
                </Tooltip>
              );
            })}
          </Box>

          <Typography sx={{ mt: 1.2, fontSize: 12, opacity: 0.7 }}>
            Hover a target to read its snippet. Shoot the correct ones in order.
          </Typography>
        </Paper>

        {/* Prompt + Draft */}
        <Stack spacing={2.2} sx={{ width: { xs: "100%", lg: 560 } }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              border: "2px dashed rgba(255,255,255,0.22)",
              backgroundColor: "rgba(0,0,0,0.18)",
            }}
          >
            <Typography fontWeight={950} sx={{ mb: 1 }}>
              Assembled Prompt
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderStyle: "dashed",
                borderColor: "rgba(250,204,21,0.35)",
                backgroundColor: "rgba(0,0,0,0.16)",
                minHeight: 220,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  opacity: 0.92,
                }}
              >
                {prompt || "No hits yet. Start shooting the correct targets…"}
              </Typography>
            </Paper>

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

            <Typography fontWeight={950} sx={{ mb: 1 }}>
              AI Draft (mock)
            </Typography>

            <Paper
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px dashed rgba(255,255,255,0.22)",
                backgroundColor: "rgba(0,0,0,0.14)",
                minHeight: 180,
              }}
            >
              <Typography sx={{ whiteSpace: "pre-wrap", opacity: 0.92, fontSize: 13 }}>
                {draft
                  ? typeof draft === "string"
                    ? draft
                    : JSON.stringify(draft, null, 2)
                  : "Hit FIRE to generate a draft."}
              </Typography>
            </Paper>
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  );
}