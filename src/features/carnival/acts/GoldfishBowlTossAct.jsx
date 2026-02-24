"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Stack, Typography, Button, Chip, Paper, Alert, Tooltip } from "@mui/material";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const BOOTH_IMG_SRC = "/goldfish_bowl.png"; // ✅ in /public
const BOOTH_ASPECT = "1365 / 2048"; // matches your image
const TARGET = { xPct: 0.52, yPct: 0.41 }; // landing spot (tweak if desired)

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const ROUNDS = [
  {
    id: "summary",
    title: "The 30-second Summary",
    scenario: "You have a long article. You need a 30-second skim summary you can trust.",
    badPrompt: "Summarize this.",
    betterOptions: [
      { id: "b1", text: "Summarize this.", correct: false, why: "Still vague. No structure, no constraints." },
      { id: "b2", text: "Summarize this article in 5–7 bullets. Keep it short and practical.", correct: true, why: "Format + brevity. Solid upgrade." },
      { id: "b3", text: "Write a detailed summary with every important detail included.", correct: false, why: "Scope explodes. Not skim-friendly." },
    ],
    greatOptions: [
      { id: "g1", text: "Summarize this in 3 bullets.", correct: false, why: "Too little guidance; can miss risks/next steps." },
      {
        id: "g2",
        text:
          "Summarize this article in exactly 6 bullets: 3 key points, 2 risks, 1 next step. Each bullet ≤ 14 words. No fluff.",
        correct: true,
        why: "Perfect: priorities + constraints = reliable output.",
      },
      { id: "g3", text: "Summarize, then rewrite it to be more exciting.", correct: false, why: "Mixes tasks; intent gets muddy." },
    ],
  },
  {
    id: "debug",
    title: "The Debug Report",
    scenario: "You need help debugging a bug, but you want a reproducible plan — not guesses.",
    badPrompt: "My code is broken. Fix it.",
    betterOptions: [
      { id: "b1", text: "My code is broken. Fix it.", correct: false, why: "No inputs." },
      {
        id: "b2",
        text: "Help me debug this error. Here’s the error message and the relevant code snippet.",
        correct: true,
        why: "Concrete inputs. Much better than vibes.",
      },
      { id: "b3", text: "Why doesn’t my app work? Just tell me.", correct: false, why: "Still vague." },
    ],
    greatOptions: [
      { id: "g1", text: "Fix it without asking questions.", correct: false, why: "Debugging without context is roulette." },
      {
        id: "g2",
        text:
          "Act as a senior engineer. Ask up to 5 clarifying questions, then give a step-by-step debug plan. I’ll provide: expected vs actual, error + stack trace, smallest repro snippet, and environment details.",
        correct: true,
        why: "Sets rules + required inputs + produces a plan.",
      },
      { id: "g3", text: "Search the internet for the answer and paste it here.", correct: false, why: "Not reliable for your exact case." },
    ],
  },
  {
    id: "email",
    title: "The Follow-Up Email",
    scenario: "Write a friendly, confident follow-up email after a meeting — concise with a clear CTA.",
    badPrompt: "Write an email.",
    betterOptions: [
      { id: "b1", text: "Write an email.", correct: false, why: "Zero context." },
      { id: "b2", text: "Write a friendly follow-up email after a meeting. Keep it concise.", correct: true, why: "Context + tone + brevity. Good baseline." },
      { id: "b3", text: "Write the best email ever written.", correct: false, why: "Not measurable." },
    ],
    greatOptions: [
      { id: "g1", text: "Write a follow-up email. Make it nice.", correct: false, why: "Still vague." },
      {
        id: "g2",
        text:
          "Write a follow-up email after a 30-min product demo. Tone: friendly + confident. Include: 1-line recap, 3 bullets of value, and 1 clear CTA offering two scheduling options. Under 140 words.",
        correct: true,
        why: "Reliable output prompt. Structure + CTA + constraints.",
      },
      { id: "g3", text: "Write a long email explaining every feature we discussed.", correct: false, why: "Length kills response rates; no CTA focus." },
    ],
  },
];

function PingPongBall({ index, selected, correctState, onClick }) {
  const borderColor =
    correctState === "correct"
      ? "rgba(34,197,94,0.85)"
      : correctState === "wrong"
      ? "rgba(225,29,72,0.85)"
      : selected
      ? "rgba(250,204,21,0.85)"
      : "rgba(255,255,255,0.28)";

  const glow =
    correctState === "correct"
      ? "0 0 0 7px rgba(34,197,94,0.10)"
      : correctState === "wrong"
      ? "0 0 0 7px rgba(225,29,72,0.10)"
      : selected
      ? "0 0 0 7px rgba(250,204,21,0.10)"
      : "0 0 0 7px rgba(255,255,255,0.04)";

  const bg =
    correctState === "correct"
      ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92), rgba(34,197,94,0.22) 55%, rgba(0,0,0,0.15))"
      : correctState === "wrong"
      ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92), rgba(225,29,72,0.22) 55%, rgba(0,0,0,0.15))"
      : selected
      ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92), rgba(250,204,21,0.22) 55%, rgba(0,0,0,0.15))"
      : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92), rgba(255,255,255,0.12) 55%, rgba(0,0,0,0.15))";

  return (
    <Button
      onClick={onClick}
      variant="outlined"
      aria-label={`Select option ${index + 1}`}
      sx={{
        minWidth: 0,
        width: { xs: 72, sm: 78, md: 82 },
        height: { xs: 72, sm: 78, md: 82 },
        borderRadius: "50%",
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor,
        backgroundImage: bg,
        boxShadow: `${glow}, 0 14px 35px rgba(0,0,0,0.30)`,
        color: "rgba(255,255,255,0.92)",
        "&:hover": { transform: "translateY(-1px)" },
        textTransform: "none",
        p: 0,
      }}
    >
      <Typography fontWeight={950} sx={{ fontSize: 18, textShadow: "0 2px 18px rgba(0,0,0,0.35)" }}>
        {index + 1}
      </Typography>
    </Button>
  );
}

export default function GoldfishBowlTossAct({ module, answer, onComplete }) {
  const reduce = useReducedMotion();

  const stageRef = React.useRef(null);
  const postTossActionRef = React.useRef(null);
  const completedRef = React.useRef(false);

  const [roundIdx, setRoundIdx] = React.useState(0);
  const [stage, setStage] = React.useState("better"); // better -> great -> victory
  const [picks, setPicks] = React.useState({});
  const [feedback, setFeedback] = React.useState(null);

  // wobble triggers
  const [wrongPulse, setWrongPulse] = React.useState(0);
  const [boothShake, setBoothShake] = React.useState(0);

  // toss animation state
  const [toss, setToss] = React.useState(null); // { id, fromX, fromY, toX, toY }

  // victory overlay
  const [victoryOpen, setVictoryOpen] = React.useState(false);

  // if you ever want “results mode” for already-completed answers:
  const alreadyDone = Boolean(answer && typeof answer === "object" && answer.completed);

  const round = ROUNDS[roundIdx];
  const total = ROUNDS.length;

  const currentPick = picks[round.id] || {};
  const selectedId = stage === "better" ? currentPick.betterId : currentPick.greatId;
  const options = stage === "better" ? round.betterOptions : round.greatOptions;

  const score = React.useMemo(() => {
    let s = 0;
    for (const r of ROUNDS) {
      const p = picks[r.id];
      if (!p) continue;
      const b = r.betterOptions.find((x) => x.id === p.betterId);
      const g = r.greatOptions.find((x) => x.id === p.greatId);
      if (b?.correct) s += 1;
      if (g?.correct) s += 1;
    }
    return s;
  }, [picks]);

  const maxScore = total * 2;

  const allChosen = React.useMemo(() => {
    return ROUNDS.every((r) => {
      const p = picks[r.id];
      return Boolean(p?.betterId) && Boolean(p?.greatId);
    });
  }, [picks]);

  const allCorrect = React.useMemo(() => score === maxScore && allChosen, [score, maxScore, allChosen]);

  function computeTossFromEvent(e) {
    const el = stageRef.current;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const cx = e?.clientX ?? rect.left + rect.width * 0.2;
    const cy = e?.clientY ?? rect.top + rect.height * 0.8;

    // relative to stage container
    const fromX = clamp(cx - rect.left, 20, rect.width - 20);
    const fromY = clamp(cy - rect.top, 20, rect.height - 20);

    const toX = rect.width * TARGET.xPct;
    const toY = rect.height * TARGET.yPct;

    return { fromX, fromY, toX, toY };
  }

  function startGoldfishToss(e, afterToss) {
    const coords = computeTossFromEvent(e);
    if (!coords) {
      afterToss?.();
      return;
    }

    postTossActionRef.current = afterToss;

    setToss({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...coords,
    });
  }

  function onTossComplete() {
    setToss(null);
    const fn = postTossActionRef.current;
    postTossActionRef.current = null;
    fn?.();
  }

  function handlePick(option, e) {
    if (victoryOpen) return;

    const isCorrect = Boolean(option.correct);

    if (!isCorrect) {
      setWrongPulse((n) => n + 1);
      setBoothShake((n) => n + 1);
      setFeedback({ type: "warning", text: `Womp womp. ${option.why}` });
      return;
    }

    setFeedback({ type: "success", text: option.why });

    if (stage === "better") {
      setPicks((prev) => ({
        ...prev,
        [round.id]: { ...(prev[round.id] || {}), betterId: option.id },
      }));

      startGoldfishToss(e, () => {
        setFeedback(null);
        setStage("great");
      });

      return;
    }

    setPicks((prev) => ({
      ...prev,
      [round.id]: { ...(prev[round.id] || {}), greatId: option.id },
    }));

    const isLastRound = roundIdx === total - 1;

    startGoldfishToss(e, () => {
      setFeedback(null);

      if (isLastRound) {
        setVictoryOpen(true);
        setStage("victory");
      } else {
        setStage("better");
        setRoundIdx((i) => Math.min(total - 1, i + 1));
      }
    });
  }

  function finishStamp() {
    if (completedRef.current) return;
    completedRef.current = true;

    const payload = {
      type: "bow_toss",
      completed: true,
      picks,
      score,
      maxScore,
      perfect: allCorrect,
      completedAt: Date.now(),
    };

    onComplete?.(payload);
  }

  function resetPractice() {
    setFeedback(null);
    setPicks({});
    setRoundIdx(0);
    setStage("better");
    setVictoryOpen(false);
    setToss(null);
  }

  if (alreadyDone) {
    const pct = Math.round((Number(answer.score || 0) / Math.max(1, Number(answer.maxScore || 1))) * 100);
    return (
      <Stack spacing={2.2}>
        <Typography variant="h4">{module?.title ?? "Goldfish Bowl Toss"}</Typography>
        <Typography sx={{ opacity: 0.9 }}>✅ Goldfish secured.</Typography>

        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        >
          <Typography fontWeight={950}>Score</Typography>
          <Typography sx={{ opacity: 0.9 }}>
            {answer.score}/{answer.maxScore} ({pct}%){answer.perfect ? " — perfect run 🐟🏆" : ""}
          </Typography>
        </Paper>

        <Button
          variant="outlined"
          onClick={resetPractice}
          sx={{
            borderRadius: 999,
            borderStyle: "dashed",
            borderColor: "rgba(250,204,21,0.55)",
            color: "rgba(255,255,255,0.9)",
            width: "fit-content",
          }}
        >
          Practice Again (no extra tickets)
        </Button>
      </Stack>
    );
  }

  const stageLabel =
    stage === "better"
      ? "Step 1: Bad → Better"
      : stage === "great"
      ? "Step 2: Better → Great"
      : "Victory";

  const selectedOption = options.find((o) => o.id === selectedId);
  const correctState = selectedId == null ? null : selectedOption?.correct ? "correct" : "wrong";

  const boothShakeAnim = reduce
    ? {}
    : boothShake
    ? {
        x: [0, -10, 10, -8, 8, -5, 5, 0],
        rotate: [0, -1.2, 1.2, -0.9, 0.9, -0.6, 0.6, 0],
      }
    : {};

  return (
    <Stack spacing={2.2}>
      {/* ✅ FIX: make Victory overlay sticky-to-viewport (so you always see it) */}
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
              zIndex: 2000,
              backgroundColor: "rgba(0,0,0,0.70)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            <MotionBox
              initial={reduce ? { scale: 1, y: 0 } : { scale: 0.85, y: 16 }}
              animate={reduce ? { scale: 1, y: 0 } : { scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 10 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 18 }}
              sx={{
                width: "100%",
                maxWidth: 560,
                borderRadius: 3,
                overflow: "hidden",
                border: "2px dashed rgba(255,255,255,0.22)",
                boxShadow: "0 22px 70px rgba(0,0,0,0.65)",
                backgroundColor: "rgba(18,10,12,0.92)",
                backgroundImage: `
                  radial-gradient(800px 420px at 30% 0%, rgba(250,204,21,0.22), transparent 60%),
                  radial-gradient(800px 420px at 80% 20%, rgba(225,29,72,0.22), transparent 60%)
                `,
              }}
            >
              <Box sx={{ borderBottom: "1px dashed rgba(255,255,255,0.16)", py: 1.2, overflow: "hidden" }}>
                {!reduce ? (
                  <MotionBox
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                    sx={{ display: "flex", gap: 4, whiteSpace: "nowrap", px: 2 }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Typography
                        key={i}
                        sx={{
                          fontWeight: 950,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          color: "rgba(250,204,21,0.95)",
                          textShadow: "0 2px 18px rgba(250,204,21,0.18)",
                        }}
                      >
                        YOU WON A GOLDFISH • 🐟 • YOU WON A GOLDFISH • 🐟 •
                      </Typography>
                    ))}
                  </MotionBox>
                ) : (
                  <Typography
                    sx={{
                      textAlign: "center",
                      fontWeight: 950,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "rgba(250,204,21,0.95)",
                    }}
                  >
                    YOU WON A GOLDFISH
                  </Typography>
                )}
              </Box>

              <Box sx={{ p: 2.5 }}>
                <Typography variant="h5" fontWeight={950} sx={{ mb: 0.75 }}>
                  Prize Unlocked 🐟
                </Typography>

                <Typography sx={{ opacity: 0.9, lineHeight: 1.55 }}>
                  You upgraded every prompt to <b>Great</b>. That’s how you get reliable output.
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
                  <Typography fontWeight={950}>
                    Score: {score}/{maxScore}
                    {allCorrect ? " — perfect run 🏆" : ""}
                  </Typography>
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
                    Stamp Ticket + Claim Goldfish
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
                    Let me admire it
                  </Button>
                </Stack>
              </Box>
            </MotionBox>
          </MotionBox>
        ) : null}
      </AnimatePresence>

      <Stack spacing={0.5}>
        <Typography variant="h4">{module?.title ?? "Goldfish Bowl Toss"}</Typography>
        <Typography sx={{ opacity: 0.85 }}>
          {module?.park?.blurb ?? "Prompts: Bad → Better → Great. Upgrade prompts step-by-step and win reliable output."}
        </Typography>
      </Stack>

      {/* Progress + Score */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} alignItems="center">
        <Chip
          label={`Round ${roundIdx + 1}/${total}`}
          sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.22)" }}
        />
        <Chip
          label={`Score: ${score}/${maxScore}`}
          sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.22)" }}
        />
        <Chip
          label={stageLabel}
          sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(250,204,21,0.35)" }}
        />
      </Stack>

      {/* Booth Image + Toss Target */}
      <MotionBox
        animate={boothShakeAnim}
        transition={reduce ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.20)",
          boxShadow: "0 16px 60px rgba(0,0,0,0.35)",
        }}
      >
        <Box
          ref={stageRef}
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: BOOTH_ASPECT,
            maxWidth: 720,
            mx: "auto",
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        >
          <Image
            src={BOOTH_IMG_SRC}
            alt="Goldfish Bowl Toss"
            fill
            priority
            sizes="(max-width: 700px) 92vw, 720px"
            style={{ objectFit: "contain" }}
          />

          {!reduce ? (
            <MotionBox
              aria-hidden
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              sx={{
                position: "absolute",
                left: `${TARGET.xPct * 100}%`,
                top: `${TARGET.yPct * 100}%`,
                transform: "translate(-50%, -50%)",
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "2px dashed rgba(250,204,21,0.55)",
                boxShadow: "0 0 0 6px rgba(250,204,21,0.10)",
                pointerEvents: "none",
              }}
            />
          ) : null}

          <AnimatePresence>
            {toss ? (
              <MotionBox
                key={toss.id}
                initial={{ x: toss.fromX, y: toss.fromY, opacity: 1, scale: 0.9, rotate: -10 }}
                animate={{
                  x: [toss.fromX, (toss.fromX + toss.toX) / 2, toss.toX],
                  y: [toss.fromY, Math.min(toss.fromY, toss.toY) - 160, toss.toY],
                  rotate: [-10, 12, 0],
                  scale: [0.9, 1.15, 0.55],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: reduce ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
                onAnimationComplete={onTossComplete}
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(250,204,21,0.35) 45%, rgba(225,29,72,0.25))",
                  border: "2px solid rgba(255,255,255,0.35)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  pointerEvents: "none",
                }}
              >
                <Typography sx={{ fontSize: 22, lineHeight: 1 }}>🐟</Typography>
              </MotionBox>
            ) : null}
          </AnimatePresence>
        </Box>
      </MotionBox>

      {/* Scenario + bad prompt */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.22)",
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 0.5 }}>
          {round.title}
        </Typography>
        <Typography sx={{ opacity: 0.9 }}>{round.scenario}</Typography>

        <Box sx={{ mt: 1.5 }}>
          <Typography sx={{ fontSize: 13, opacity: 0.75, mb: 0.5 }}>
            Bad prompt:
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              borderStyle: "dashed",
              borderColor: "rgba(225,29,72,0.50)",
              backgroundColor: "rgba(0,0,0,0.18)",
            }}
          >
            <Typography sx={{ whiteSpace: "pre-wrap", opacity: 0.92 }}>
              {round.badPrompt}
            </Typography>
          </Paper>
        </Box>
      </Paper>

      {/* Feedback */}
      <AnimatePresence>
        {feedback ? (
          <MotionBox
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
          >
            <Alert severity={feedback.type}>{feedback.text}</Alert>
          </MotionBox>
        ) : null}
      </AnimatePresence>

      {/* Options → Ping Pong Balls w/ Tooltip */}
      <Stack spacing={1.2}>
        <Typography sx={{ opacity: 0.9, fontWeight: 900 }}>
          {stage === "better"
            ? "Pick the Better prompt (hover then pick a ball):"
            : stage === "great"
            ? "Now pick the Great prompt (hover then pick a ball):"
            : " "}
        </Typography>

        <Stack
          direction="row"
          spacing={1.4}
          sx={{
            justifyContent: { xs: "flex-start", md: "center" },
            alignItems: "center",
            overflowX: "auto",
            py: 1,
            px: 0.5,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.18)",
            backgroundColor: "rgba(0,0,0,0.14)",
            scrollSnapType: "x mandatory",
            "&::-webkit-scrollbar": { height: 8 },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999 },
          }}
        >
          {options.map((opt, i) => {
            const isSel = selectedId === opt.id;
            const isWrong = isSel && !opt.correct;
            const state = isSel ? (opt.correct ? "correct" : "wrong") : null;

            return (
              <Tooltip
                key={opt.id}
                title={
                  <Box sx={{ p: 0.5, maxWidth: 520 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 12, mb: 0.5, opacity: 0.95 }}>
                      {stage === "better" ? "Better prompt" : "Great prompt"}
                    </Typography>
                    <Typography sx={{ fontSize: 12, opacity: 0.92, whiteSpace: "pre-wrap" }}>
                      {opt.text}
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
                enterDelay={180}
                enterNextDelay={120}
                disableInteractive={false}
              >
                <MotionBox
                  sx={{ scrollSnapAlign: "start" }}
                  animate={
                    !reduce && isWrong
                      ? { rotate: [0, -10, 10, -7, 7, 0], x: [0, -10, 10, -7, 7, 0] }
                      : { rotate: 0, x: 0 }
                  }
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PingPongBall
                    index={i}
                    selected={isSel}
                    correctState={state}
                    onClick={(e) => handlePick(opt, e)}
                  />

                  {!reduce && isWrong ? (
                    <MotionBox
                      key={`womp-${wrongPulse}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      sx={{ mt: 0.6, textAlign: "center" }}
                    >
                      <Typography sx={{ fontSize: 12, opacity: 0.75 }}>🎺 wah-wahhh…</Typography>
                    </MotionBox>
                  ) : null}
                </MotionBox>
              </Tooltip>
            );
          })}
        </Stack>

        {/* Ball Readout */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        >
          <Typography fontWeight={950} sx={{ mb: 0.8 }}>
            Ball Readout
          </Typography>

          {selectedId ? (
            <>
              <Typography sx={{ fontSize: 13, opacity: 0.7, mb: 0.5 }}>
                Selected option:
              </Typography>
              <Typography sx={{ whiteSpace: "pre-wrap", opacity: 0.92 }}>
                {selectedOption?.text}
              </Typography>
            </>
          ) : (
            <Typography sx={{ opacity: 0.75 }}>
              Pick a ping-pong ball to see the prompt here.
            </Typography>
          )}
        </Paper>
      </Stack>

      {/* Controls */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 1 }}>
        <Button
          variant="outlined"
          onClick={() => {
            setFeedback(null);
            setStage("better");
            setRoundIdx((i) => Math.max(0, i - 1));
          }}
          disabled={roundIdx === 0 || victoryOpen}
          sx={{
            borderRadius: 999,
            borderStyle: "dashed",
            borderColor: "rgba(255,255,255,0.35)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Back
        </Button>

        <Button
          variant="outlined"
          onClick={resetPractice}
          disabled={victoryOpen}
          sx={{
            borderRadius: 999,
            borderStyle: "dashed",
            borderColor: "rgba(225,29,72,0.45)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Reset Toss
        </Button>

        <Box sx={{ flex: 1 }} />

        <Chip
          label={stageLabel}
          sx={{
            alignSelf: "center",
            backgroundColor: "rgba(0,0,0,0.28)",
            border: "1px dashed rgba(250,204,21,0.35)",
          }}
        />
      </Stack>
    </Stack>
  );
}