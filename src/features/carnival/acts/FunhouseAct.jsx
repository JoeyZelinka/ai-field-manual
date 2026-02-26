"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Stack, Typography, Chip, Button, Divider } from "@mui/material";
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

/**
 * 🔧 Update these paths to match what you placed in /public
 */
const IMG = {
  hero: "/funhouse.png",
  corridor: "/funhouse_corridor.png",
  marker: "/you_are_here.png",
  rooms: {
    mirror_maze_unknown_facts: "/funhouse/room1_mirror_maze.png",
    format_control: "/funhouse/room2_hall_of_formats.png",
    retrieval_grounding: "/funhouse/room3_grounding_tunnel.png",
    verification_step: "/funhouse/room4_clown_car_verification.png",
  },
};

const SCENARIOS = [
  {
    id: "mirror_maze_unknown_facts",
    title: "Mirror Maze: Unknown Facts",
    prompt: "You need an answer, but you’re not sure the model can actually know it.",
    question: "Which prompt most reduces hallucinations?",
    options: [
      { label: "A", text: "Give me your best estimate and make it sound confident." },
      { label: "B", text: "Tell me the exact revenue of Company X last quarter. Don’t mention uncertainty." },
      {
        label: "C",
        text:
          "If you’re not certain, say “I don’t know.” Ask up to 3 clarifying questions. " +
          "If you make a claim, label it as either (certain) or (best guess).",
      },
    ],
    correct: "C",
    why:
      "You’re explicitly allowing uncertainty and requiring clarification + confidence labeling. " +
      "That’s the fastest way to stop confident nonsense.",
  },
  {
    id: "format_control",
    title: "Hall of Formats",
    prompt: "You want a structured output you can trust and parse.",
    question: "Which prompt is best?",
    options: [
      {
        label: "A",
        text:
          "Return JSON with keys: {summary, risks, open_questions}. " +
          "If information is missing, set the field to null and explain why in open_questions.",
      },
      { label: "B", text: "Write it like a blog post with headings and vibes." },
      { label: "C", text: "Summarize the policy and include anything important." },
    ],
    correct: "A",
    why:
      "Schemas force discipline. Explicit nulls + missing-info handling prevents the model from inventing filler.",
  },
  {
    id: "retrieval_grounding",
    title: "The Grounding Tunnel",
    prompt: "You have source text and want answers only from that text.",
    question: "Which prompt is safest?",
    options: [
      { label: "A", text: "Answer from the document and your general knowledge." },
      {
        label: "B",
        text:
          "Use only the provided text. If the answer isn’t in the text, say “Not in the provided source.” " +
          "Quote the exact sentence(s) you used.",
      },
      { label: "C", text: "If it’s not in the text, infer what the author probably meant." },
    ],
    correct: "B",
    why:
      "Hard grounding rules + quoting forces the model to anchor. ‘Infer’ is where hallucinations breed.",
  },
  {
    id: "verification_step",
    title: "Clown Car of Verification",
    prompt: "You need a plan that’s accurate and internally consistent.",
    question: "Which prompt reduces errors best?",
    options: [
      { label: "A", text: "Give me the plan quickly. No need to double-check." },
      { label: "B", text: "Write the plan with maximum confidence and no caveats." },
      {
        label: "C",
        text:
          "Draft the plan. Then run a self-check: list 3 assumptions, 3 risks, and 3 ways the plan could fail. " +
          "Revise the plan to address the biggest risk.",
      },
    ],
    correct: "C",
    why:
      "A verification pass is cheap insurance. Forcing assumptions/risks makes hidden uncertainty explicit.",
  },
];

function normalizeAnswer(answer) {
  const a = answer && typeof answer === "object" ? answer : null;
  const responses =
    a?.responses && typeof a.responses === "object" && !Array.isArray(a.responses) ? a.responses : {};

  return {
    type: "funhouse_v1",
    responses,
    score: Number.isFinite(a?.score) ? a.score : 0,
    stampedAt: Number.isFinite(a?.stampedAt) ? a.stampedAt : null,
  };
}

// consecutive-correct depth from the start (the “furthest room you’ve reached”)
function computeDepth(responses) {
  let d = 0;
  for (let i = 0; i < SCENARIOS.length; i++) {
    const sc = SCENARIOS[i];
    const pick = responses?.[sc.id] ?? null;
    if (pick && pick === sc.correct) d += 1;
    else break;
  }
  return d; // 0..SCENARIOS.length
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function optionJitter(roomIndex, optionIndex, reduce) {
  if (reduce) return { x: 0, y: 0, r: 0 };
  const dir = (roomIndex + optionIndex) % 2 === 0 ? -1 : 1;
  return {
    x: dir * (18 + optionIndex * 10),
    y: (optionIndex % 2 === 0 ? 1 : -1) * (6 + roomIndex * 1.5),
    r: dir * (0.9 + optionIndex * 0.35),
  };
}

export default function FunhouseAct({ module, answer, onComplete }) {
  const reduce = useReducedMotion();
  const state = React.useMemo(() => normalizeAnswer(answer), [answer]);

  const [responses, setResponses] = React.useState(state.responses);

  // “door opened” moment
  const [advanceFlash, setAdvanceFlash] = React.useState(false);

  React.useEffect(() => {
    setResponses(state.responses);
  }, [state.responses]);

  const total = SCENARIOS.length;

  const score = React.useMemo(() => {
    let s = 0;
    for (const sc of SCENARIOS) {
      const pick = responses?.[sc.id];
      if (pick && pick === sc.correct) s += 1;
    }
    return s;
  }, [responses]);

  const depth = React.useMemo(() => computeDepth(responses), [responses]);
  const allCleared = depth >= total;
  const activeRoomIndex = allCleared ? total - 1 : depth;

  const roomRefs = React.useRef([]);
  const endRef = React.useRef(null);
  const prevDepthRef = React.useRef(depth);

  // whimsical background drift tied to scroll
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 1200], reduce ? [0, 0] : [0, -22]);
  const bgRot = useTransform(scrollY, [0, 1200], reduce ? [0, 0] : [0, -0.6]);

  // auto-scroll when depth increases (correct answer advances you)
  React.useEffect(() => {
    const prev = prevDepthRef.current;
    if (depth > prev) {
      setAdvanceFlash(true);
      const t1 = setTimeout(() => setAdvanceFlash(false), 650);

      const targetEl = depth < total ? roomRefs.current[depth] : endRef.current;

      const t2 = setTimeout(() => {
        try {
          targetEl?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
          // no-op
        }
      }, reduce ? 0 : 260);

      prevDepthRef.current = depth;
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    prevDepthRef.current = depth;
  }, [depth, reduce, total]);

  const answeredCount = React.useMemo(() => Object.keys(responses || {}).length, [responses]);

  const pickOption = (scenarioIndex, scenarioId, label) => {
    // lock: only allow interaction up to the currently unlocked room
    if (!allCleared && scenarioIndex > depth) return;
    setResponses((prev) => ({ ...(prev || {}), [scenarioId]: label }));
  };

  const reset = () => setResponses({});

  const stampTicket = () => {
    if (!allCleared) return;
    const payload = {
      type: "funhouse_v1",
      responses,
      score,
      max: total,
      stampedAt: Date.now(),
    };
    onComplete?.(payload);
  };

  const progress01 = total > 0 ? clamp(Math.min(depth, total) / total, 0, 1) : 0;

  const roomCard = {
    hidden: {
      opacity: 0,
      y: reduce ? 0 : 16,
      scale: reduce ? 1 : 0.985,
      rotate: reduce ? 0 : -0.35,
      filter: reduce ? "blur(0px)" : "blur(7px)",
    },
    show: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      filter: "blur(0px)",
      transition: reduce
        ? { duration: 0.01 }
        : { type: "spring", stiffness: 260, damping: 22, delay: Math.min(0.24, i * 0.05) },
    }),
  };

  const questionPop = {
    hidden: (i) => ({
      opacity: 0,
      y: reduce ? 0 : 10,
      x: reduce ? 0 : (i % 2 === 0 ? -8 : 8),
      rotate: reduce ? 0 : (i % 2 === 0 ? -0.4 : 0.4),
    }),
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      rotate: 0,
      transition: reduce ? { duration: 0.01 } : { type: "spring", stiffness: 320, damping: 24 },
    },
  };

  const optionWrap = {
    hidden: (custom) => ({
      opacity: 0,
      x: custom.x,
      y: custom.y,
      rotate: custom.r,
      scale: reduce ? 1 : 0.985,
    }),
    show: (custom) => ({
      opacity: 1,
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      transition: reduce
        ? { duration: 0.01 }
        : { type: "spring", stiffness: 340, damping: 22, delay: clamp(custom.delay, 0, 0.22) },
    }),
  };

  // ✅ UPDATED: connector is now a clean “light strip” (no corridor image)
  const connector = (passed) => (
    <Box aria-hidden sx={{ py: 1.6, display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          position: "relative",
          width: "min(920px, 96%)",
          height: 22,
          borderRadius: 999,
          overflow: "hidden",
          border: "1px dashed rgba(255,255,255,0.18)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
          backgroundImage: passed
            ? "linear-gradient(90deg, rgba(34,197,94,0.20), rgba(250,204,21,0.16), rgba(225,29,72,0.14))"
            : "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
        }}
      >
        {!reduce ? (
          <MotionBox
            aria-hidden
            animate={{ x: ["-18%", "118%"] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "linear" }}
            sx={{
              position: "absolute",
              top: -12,
              width: 140,
              height: 46,
              opacity: passed ? 0.75 : 0.25,
              filter: "blur(10px)",
              background: "radial-gradient(closest-side, rgba(250,204,21,0.34), transparent 70%)",
            }}
          />
        ) : null}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: { xs: 2, md: 3 },
        border: "2px dashed rgba(255,255,255,0.18)",
        backgroundColor: "rgba(0,0,0,0.20)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* candy mist */}
      <MotionBox
        aria-hidden
        style={{ y: bgY, rotate: bgRot }}
        sx={{
          position: "absolute",
          inset: -180,
          pointerEvents: "none",
          opacity: 0.55,
          filter: "blur(34px)",
          mixBlendMode: "screen",
          backgroundImage: `
            radial-gradient(800px 420px at 25% 10%, rgba(250,204,21,0.18), transparent 60%),
            radial-gradient(800px 420px at 80% 20%, rgba(225,29,72,0.16), transparent 60%),
            radial-gradient(760px 420px at 40% 75%, rgba(59,130,246,0.12), transparent 60%)
          `,
        }}
      />

      <Stack spacing={2} sx={{ position: "relative", zIndex: 1 }}>
        {/* GRAND HEADER: marquee + progress */}
        <Box
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: "1px dashed rgba(255,255,255,0.18)",
            backgroundColor: "rgba(0,0,0,0.22)",
            boxShadow: "0 14px 50px rgba(0,0,0,0.38)",
          }}
        >
          {/* Marquee sign (BIG) */}
          <Box
            sx={{
    position: "relative",
    px: { xs: 1.25, md: 2 },
    pt: { xs: 1.1, md: 1.4 },
    pb: { xs: 0.75, md: 0.95 },
  }}
          >
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
    <Box
  sx={{
    position: "relative",
    width: "min(900px, 100%)",     // was 860
    height: { xs: 500, md: 565 },  // was 200/260
    borderRadius: 2.5,
    overflow: "hidden",
  
  }}
>
  <Image
    src={IMG.hero}
    alt="Funhouse"
    fill
    sizes="(max-width: 900px) 92vw, 900px"
    style={{
      objectFit: "cover",
      objectPosition: "center",    // try "center 45%" if top feels clipped
      transform: "scale(1.06)",    // was 1.12
    }}
    priority
  />
</Box>
  </Box>

            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mt: { xs: 1.25, md: 1.5 } }}
            >
              <Stack spacing={0.5}>
                <Typography fontWeight={950} sx={{ letterSpacing: 0.2 }}>
                  {module?.park?.attraction || "The Funhouse"}
                </Typography>
                <Typography sx={{ opacity: 0.82 }}>
                  Whimsical prompt guardrails to keep the model honest — and your outputs sane and hallucination free.
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip
                  label={`Rooms cleared: ${Math.min(depth, total)}/${total}`}
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.28)",
                    border: "1px dashed rgba(255,255,255,0.22)",
                    color: "rgba(255,255,255,0.92)",
                  }}
                />
                <Chip
                  label={`Answered: ${answeredCount}/${total}`}
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.28)",
                    border: "1px dashed rgba(250,204,21,0.35)",
                    color: "rgba(255,255,255,0.92)",
                  }}
                />
                <Chip
                  label={`Score: ${score}/${total}`}
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.28)",
                    border: "1px dashed rgba(225,29,72,0.35)",
                    color: "rgba(255,255,255,0.92)",
                  }}
                />
              </Stack>
            </Stack>
          </Box>

          {/* ✅ UPDATED: Progress strip (NO corridor image now) */}
          <Box
            sx={{
              position: "relative",
              height: { xs: 96, md: 120 },
              background:
                "linear-gradient(135deg, rgba(225,29,72,0.20), rgba(250,204,21,0.14), rgba(59,130,246,0.12))",
            }}
          >
            {/* subtle dot/polka texture */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                opacity: 0.12,
                backgroundImage:
                  "radial-gradient(circle at 14px 14px, rgba(255,255,255,0.22) 0 1px, transparent 2px)",
                backgroundSize: "26px 26px",
              }}
            />
            {/* darken for readability */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.55))",
              }}
            />

            {/* progress track */}
            <Box
              sx={{
                position: "absolute",
                left: "4%",
                right: "4%",
                bottom: { xs: 18, md: 20 },
                height: 10,
                borderRadius: 999,
                border: "1px dashed rgba(255,255,255,0.22)",
                backgroundColor: "rgba(0,0,0,0.28)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${progress01 * 100}%`,
                  backgroundImage:
                    "linear-gradient(90deg, rgba(34,197,94,0.55), rgba(250,204,21,0.55), rgba(225,29,72,0.55))",
                }}
              />
            </Box>

            {/* You are here marker */}
            <MotionBox
              aria-hidden
              animate={reduce ? { y: 0 } : { y: [0, -4, 0], rotate: [-0.4, 0.4, -0.4] }}
              transition={reduce ? { duration: 0.01 } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              sx={{
                position: "absolute",
                left: `${clamp(progress01, 0.03, 0.97) * 100}%`,
                bottom: { xs: 34, md: 38 },
                transform: "translateX(-50%)",
                width: { xs: 44, md: 52 },
                height: { xs: 44, md: 52 },
                filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45))",
                zIndex: 2,
              }}
            >
              <Image src={IMG.marker} alt="" width={128} height={128} style={{ width: "100%", height: "100%" }} />
            </MotionBox>

            <Typography
              sx={{
                position: "absolute",
                left: "4%",
                top: 10,
                fontSize: 12,
                opacity: 0.88,
                fontWeight: 850,
                zIndex: 2,
              }}
            >
              Progress: {Math.min(depth, total)}/{total}
            </Typography>
          </Box>
        </Box>

        {/* Mini cheat sheet */}
        <Box
          sx={{
            borderRadius: 2,
            p: 2,
            border: "1px dashed rgba(250,204,21,0.30)",
            backgroundColor: "rgba(250,204,21,0.06)",
          }}
        >
          <Typography fontWeight={900} sx={{ mb: 0.8 }}>
            Anti-hallucination recipe
          </Typography>
          <Stack spacing={0.6} sx={{ opacity: 0.9, fontSize: 14 }}>
            <Typography>• Define the goal + context.</Typography>
            <Typography>• Add constraints + required output format.</Typography>
            <Typography>• Force uncertainty: “If unsure, say so.”</Typography>
            <Typography>• Ground to sources when possible; quote evidence.</Typography>
            <Typography>• Add a verification pass (assumptions/risks).</Typography>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.14)" }} />

        {/* Door-open flash on progress */}
        <AnimatePresence>
          {advanceFlash && !reduce ? (
            <MotionBox
              key="advanceFlash"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              sx={{
                borderRadius: 2,
                p: 1.25,
                border: "1px dashed rgba(250,204,21,0.35)",
                backgroundColor: "rgba(250,204,21,0.10)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
              }}
            >
              <Typography sx={{ fontSize: 13, opacity: 0.92, fontWeight: 850 }}>
                🚪✨ Door unlocked. Deeper into the Funhouse you go…
              </Typography>
            </MotionBox>
          ) : null}
        </AnimatePresence>

        {/* Rooms */}
        <Stack spacing={0} sx={{ pb: 0.5 }}>
          {SCENARIOS.map((sc, i) => {
            const picked = responses?.[sc.id] || null;
            const isCorrect = picked && picked === sc.correct;

            const isUnlocked = allCleared ? true : i <= depth;
            const isActive = allCleared ? false : i === activeRoomIndex;

            const artSrc = IMG.rooms?.[sc.id] || IMG.corridor;

            return (
              <React.Fragment key={sc.id}>
                <MotionBox
                  ref={(el) => {
                    roomRefs.current[i] = el;
                  }}
                  variants={roomCard}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                  sx={{
                    borderRadius: 3,
                    p: 2,
                    border: "1px dashed rgba(255,255,255,0.18)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                    boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
                    position: "relative",
                    overflow: "hidden",
                    opacity: isUnlocked ? 1 : 0.58,
                    filter: isUnlocked ? "blur(0px)" : "blur(1.6px)",
                  }}
                >
                  {/* lock veil */}
                  {!isUnlocked ? (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, rgba(0,0,0,0.72), rgba(0,0,0,0.38))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                      }}
                    >
                      <Chip
                        label="🔒 Clear the previous room to enter"
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.45)",
                          border: "1px dashed rgba(255,255,255,0.22)",
                          color: "rgba(255,255,255,0.92)",
                        }}
                      />
                    </Box>
                  ) : null}

                  {/* YOU ARE HERE on current room */}
                  {isActive ? (
                    <MotionBox
                      aria-hidden
                      animate={reduce ? { rotate: 0 } : { rotate: [-1.2, 1.2, -1.2], y: [0, -3, 0] }}
                      transition={reduce ? { duration: 0.01 } : { duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        width: 58,
                        height: 58,
                        zIndex: 9,
                        filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45))",
                      }}
                    >
                      <Image src={IMG.marker} alt="" width={128} height={128} style={{ width: "100%", height: "100%" }} />
                    </MotionBox>
                  ) : null}

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ position: "relative", zIndex: 2 }}>
                    {/* BIG ROOM ART */}
                    <Box
                      sx={{
                        position: "relative",
                        width: { xs: "100%", md: 280 },
                        minWidth: { md: 280 },
                        height: { xs: 190, md: 280 },
                        borderRadius: 2.5,
                        overflow: "hidden",
                        border: "1px dashed rgba(255,255,255,0.18)",
                        boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
                      }}
                    >
                      <Image
                        src={artSrc}
                        alt=""
                        fill
                        sizes="(max-width: 900px) 92vw, 280px"
                        style={{ objectFit: "cover" }}
                        priority={false}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.55))",
                        }}
                      />
                      <Box sx={{ position: "absolute", left: 12, bottom: 12, right: 12 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                          <Chip
                            size="small"
                            label={`Room ${i + 1}`}
                            sx={{
                              backgroundColor: "rgba(0,0,0,0.40)",
                              border: "1px dashed rgba(255,255,255,0.22)",
                              color: "rgba(255,255,255,0.92)",
                            }}
                          />
                          {isActive ? (
                            <Chip
                              size="small"
                              label="🎠 Current"
                              sx={{
                                backgroundColor: "rgba(250,204,21,0.16)",
                                border: "1px dashed rgba(250,204,21,0.35)",
                                color: "rgba(255,255,255,0.92)",
                              }}
                            />
                          ) : null}
                          {picked ? (
                            <Chip
                              size="small"
                              label={isCorrect ? "✅ Correct" : "🪞 Try again"}
                              sx={{
                                backgroundColor: isCorrect ? "rgba(34,197,94,0.16)" : "rgba(225,29,72,0.14)",
                                border: `1px dashed ${isCorrect ? "rgba(34,197,94,0.35)" : "rgba(225,29,72,0.35)"}`,
                                color: "rgba(255,255,255,0.92)",
                              }}
                            />
                          ) : null}
                        </Stack>
                        <Typography sx={{ mt: 0.9, fontWeight: 950, letterSpacing: 0.2 }}>{sc.title}</Typography>
                        <Typography sx={{ opacity: 0.82, fontSize: 13, mt: 0.4 }}>{sc.prompt}</Typography>
                      </Box>
                    </Box>

                    {/* ✅ UPDATED: CONTENT now has corridor background INSIDE the Q/A card */}
                    <Box
                      sx={{
                        position: "relative",
                        flex: 1,
                        borderRadius: 2.5,
                        overflow: "hidden",
                        border: "1px dashed rgba(255,255,255,0.18)",
                        boxShadow: "0 12px 34px rgba(0,0,0,0.30)",
                      }}
                    >
                      {/* corridor backdrop */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0.55,
                          filter: "saturate(1.05)",
                        }}
                      >
                        <Image
                          src={IMG.corridor}
                          alt=""
                          fill
                          sizes="(max-width: 900px) 92vw, 720px"
                          style={{ objectFit: "cover" }}
                          priority={false}
                        />
                      </Box>

                      {/* readability veil */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(135deg, rgba(0,0,0,0.78), rgba(0,0,0,0.46))",
                        }}
                      />

                      {/* content */}
                      <Stack spacing={1.2} sx={{ position: "relative", zIndex: 1, p: { xs: 1.5, md: 2 } }}>
                        <MotionBox
                          variants={questionPop}
                          custom={i}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true, amount: 0.4 }}
                        >
                          <Typography fontWeight={900} sx={{ opacity: 0.98, fontSize: 16 }}>
                            {sc.question}
                          </Typography>
                        </MotionBox>

                        <Stack spacing={1}>
                          {sc.options.map((opt, optIdx) => {
                            const active = picked === opt.label;
                            const showCorrect = picked && opt.label === sc.correct;
                            const disabled = !isUnlocked;

                            const j = optionJitter(i, optIdx, reduce);

                            return (
                              <MotionBox
                                key={opt.label}
                                variants={optionWrap}
                                custom={{ ...j, delay: 0.04 * optIdx }}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.3 }}
                                whileHover={
                                  reduce
                                    ? {}
                                    : {
                                        rotate: active ? 0 : j.r * 0.45,
                                        scale: disabled ? 1 : 1.015,
                                        y: disabled ? 0 : -1,
                                      }
                                }
                                whileTap={reduce ? {} : { scale: disabled ? 1 : 0.99 }}
                              >
                                <Button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => pickOption(i, sc.id, opt.label)}
                                  variant="outlined"
                                  sx={{
                                    width: "100%",
                                    borderRadius: 2.25,
                                    textAlign: "left",
                                    alignItems: "flex-start",
                                    justifyContent: "flex-start",
                                    borderStyle: "dashed",
                                    borderColor: active ? "rgba(250,204,21,0.62)" : "rgba(255,255,255,0.22)",
                                    backgroundColor: active ? "rgba(250,204,21,0.09)" : "rgba(0,0,0,0.20)",
                                    color: "rgba(255,255,255,0.92)",
                                    px: 2,
                                    py: 1.35,
                                    opacity: disabled ? 0.62 : 1,
                                    boxShadow: active ? "0 10px 26px rgba(0,0,0,0.28)" : "none",
                                    backdropFilter: "blur(2px)",
                                  }}
                                >
                                  <Stack spacing={0.6} sx={{ width: "100%" }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Chip
                                        size="small"
                                        label={opt.label}
                                        sx={{
                                          backgroundColor: "rgba(0,0,0,0.26)",
                                          border: "1px dashed rgba(255,255,255,0.22)",
                                          color: "rgba(255,255,255,0.9)",
                                        }}
                                      />
                                      {showCorrect && picked ? (
                                        <Typography sx={{ opacity: 0.9, fontWeight: 900 }}>Best choice</Typography>
                                      ) : null}
                                    </Stack>
                                    <Typography sx={{ opacity: 0.92 }}>{opt.text}</Typography>
                                  </Stack>
                                </Button>
                              </MotionBox>
                            );
                          })}
                        </Stack>

                        {picked ? (
                          <MotionBox
                            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 260, damping: 24 }}
                            sx={{
                              borderRadius: 2,
                              p: 1.25,
                              border: "1px dashed rgba(255,255,255,0.18)",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              backdropFilter: "blur(2px)",
                            }}
                          >
                            <Typography sx={{ fontSize: 13, opacity: 0.92 }}>
                              <b>Why:</b> {sc.why}
                            </Typography>
                          </MotionBox>
                        ) : (
                          <Box
                            sx={{
                              borderRadius: 2,
                              p: 1.1,
                              border: "1px dashed rgba(255,255,255,0.14)",
                              backgroundColor: "rgba(255,255,255,0.03)",
                              backdropFilter: "blur(2px)",
                            }}
                          >
                            <Typography sx={{ fontSize: 13, opacity: 0.82 }}>
                              Pick an answer to open the next door.
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </MotionBox>

                {i < total - 1 ? connector(i < depth) : null}
              </React.Fragment>
            );
          })}
        </Stack>

        {/* Footer actions */}
        <Stack
          ref={endRef}
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ pt: 1 }}
        >
          <Button
            onClick={reset}
            variant="outlined"
            sx={{
              borderRadius: 999,
              borderStyle: "dashed",
              borderColor: "rgba(255,255,255,0.35)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Reset choices
          </Button>

          <Button
            onClick={stampTicket}
            disabled={!allCleared}
            variant="contained"
            sx={{
              borderRadius: 999,
              px: 3.2,
              minWidth: { sm: 220 },
              backgroundImage: allCleared
                ? "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))"
                : "none",
            }}
          >
            {allCleared ? "Stamp Ticket" : "Clear all rooms to stamp"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}