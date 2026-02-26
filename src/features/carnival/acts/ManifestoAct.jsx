"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// ✅ Canonical modules (keeps the manifesto overview in sync with the park map)
import modules, { getArea } from "@/features/carnival/modules.js";

const MotionBox = motion(Box);
const MotionStack = motion(Stack);

const CARD_SX = {
  p: 2,
  borderRadius: 2,
  border: "1px dashed rgba(255,255,255,0.22)",
  backgroundColor: "rgba(0,0,0,0.22)",
};

const SPARKLES = [
  { top: "10%", left: "14%", size: 7, d: 4.8, delay: 0.2 },
  { top: "18%", left: "86%", size: 6, d: 5.6, delay: 0.6 },
  { top: "32%", left: "8%", size: 5, d: 4.2, delay: 1.1 },
  { top: "36%", left: "92%", size: 8, d: 6.1, delay: 0.9 },
  { top: "62%", left: "12%", size: 6, d: 5.0, delay: 1.7 },
  { top: "68%", left: "90%", size: 5, d: 4.4, delay: 1.3 },
  { top: "82%", left: "20%", size: 7, d: 6.4, delay: 2.0 },
  { top: "84%", left: "78%", size: 6, d: 5.3, delay: 2.3 },
];

// ---------- Motion helpers ----------
function Reveal({ children, delay = 0, y = 14, once = true, amount = 0.25 }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;

  return (
    <MotionBox
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
    >
      {children}
    </MotionBox>
  );
}

function useBurstOnComplete(completed) {
  const [burstKey, setBurstKey] = React.useState(0);
  const prev = React.useRef(Boolean(completed));

  React.useEffect(() => {
    const now = Boolean(completed);
    if (!prev.current && now) setBurstKey((k) => k + 1);
    prev.current = now;
  }, [completed]);

  return burstKey;
}

function StampBurst({ burstKey }) {
  const reduce = useReducedMotion();

  const pieces = React.useMemo(() => {
    const rand = (n) => {
      const x = Math.sin(n * 9999 + burstKey * 1337) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: 22 }).map((_, i) => {
      const a = rand(i + 1) * Math.PI * 2;
      const r = 46 + rand(i + 2) * 44;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      const s = 6 + rand(i + 3) * 8;
      const rot = -180 + rand(i + 4) * 360;
      const hue =
        rand(i + 5) < 0.5
          ? "rgba(250,204,21,0.95)"
          : "rgba(225,29,72,0.95)";

      return {
        x,
        y,
        s,
        rot,
        hue,
        d: 0.55 + rand(i + 6) * 0.25,
        delay: rand(i + 7) * 0.05,
      };
    });
  }, [burstKey]);

  if (reduce || burstKey === 0) return null;

  return (
    <AnimatePresence>
      <MotionBox
        key={burstKey}
        aria-hidden
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.55 }}
        sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {pieces.map((p, idx) => (
          <MotionBox
            key={idx}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.6, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [0, 1, 0],
              scale: [0.6, 1.1, 0.85],
              rotate: p.rot,
              filter: ["blur(0px)", "blur(0px)", "blur(1px)"],
            }}
            transition={{ duration: p.d, ease: "easeOut", delay: p.delay }}
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: p.s,
              height: p.s,
              borderRadius: 999,
              backgroundColor: p.hue,
              boxShadow: "0 0 14px rgba(250,204,21,0.35)",
            }}
          />
        ))}
      </MotionBox>
    </AnimatePresence>
  );
}

// ---------- UI bits ----------
function SectionTitle({ icon, children }) {
  const reduce = useReducedMotion();

  return (
    <MotionStack
      direction="row"
      spacing={1}
      alignItems="center"
      whileHover={reduce ? undefined : { x: 2 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
    >
      <MotionBox
        aria-hidden
        animate={
          reduce
            ? undefined
            : { rotate: [0, -4, 4, 0], scale: [1, 1.05, 1] }
        }
        transition={
          reduce
            ? undefined
            : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }
        }
        sx={{ display: "inline-flex" }}
      >
        <Typography sx={{ fontSize: 16 }}>{icon}</Typography>
      </MotionBox>

      <Typography fontWeight={950} sx={{ letterSpacing: 0.25 }}>
        {children}
      </Typography>
    </MotionStack>
  );
}

function RuleRow({ n, title, body, delay = 0 }) {
  const reduce = useReducedMotion();

  return (
    <Reveal delay={delay}>
      <MotionBox
        whileHover={
          reduce ? undefined : { y: -5, rotate: n % 2 ? -0.15 : 0.15, scale: 1.01 }
        }
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        sx={{
          ...CARD_SX,
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: -40,
            background:
              "radial-gradient(420px 220px at 20% 0%, rgba(250,204,21,0.10), transparent 60%), radial-gradient(420px 220px at 80% 20%, rgba(225,29,72,0.10), transparent 60%)",
            opacity: 0,
            transition: "opacity 220ms ease",
          },
          "&:hover::after": { opacity: 1 },
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 0.75, position: "relative" }}>
          {n}) {title}
        </Typography>
        <Typography sx={{ opacity: 0.88, lineHeight: 1.55, position: "relative" }}>
          {body}
        </Typography>
      </MotionBox>
    </Reveal>
  );
}

function TentPreviewCard({ m, delay = 0 }) {
  const reduce = useReducedMotion();
  const Icon = m?.park?.icon;
  const iconEmoji =
    Icon === "fire"
      ? "🔥"
      : Icon === "brain"
      ? "🧠"
      : Icon === "edit"
      ? "📝"
      : Icon === "shield"
      ? "🛡️"
      : Icon === "sparkle"
      ? "✨"
      : Icon === "gift"
      ? "🎁"
      : "🎪";

  return (
    <Reveal delay={delay} y={18}>
      <MotionBox
        whileHover={reduce ? undefined : { y: -7, rotate: 0.18, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        sx={{ ...CARD_SX, height: "100%", position: "relative", overflow: "hidden" }}
      >
        {/* subtle shine sweep */}
        <MotionBox
          aria-hidden
          animate={
            reduce
              ? undefined
              : { opacity: [0.0, 0.18, 0.0], x: ["-30%", "30%"] }
          }
          transition={
            reduce
              ? undefined
              : { duration: 6.2, repeat: Infinity, ease: "easeInOut" }
          }
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "55%",
            background:
              "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.12) 45%, transparent 60%)",
            filter: "blur(2px)",
            pointerEvents: "none",
            opacity: 0.0,
          }}
        />

        <Stack spacing={1} sx={{ position: "relative" }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexWrap: "wrap" }}
          >
            <Typography sx={{ fontSize: 14 }}>{iconEmoji}</Typography>

            <Typography fontWeight={950} sx={{ opacity: 0.95 }}>
              {m?.park?.attraction || "Act"}
            </Typography>

            <Chip
              size="small"
              label={getArea(m)}
              variant="outlined"
              sx={{ opacity: 0.82 }}
            />

            {m?.park?.time ? (
              <Chip
                size="small"
                label={m.park.time}
                variant="outlined"
                sx={{ opacity: 0.82 }}
              />
            ) : null}

            {m?.park?.level ? (
              <Chip
                size="small"
                label={m.park.level}
                variant="outlined"
                sx={{ opacity: 0.82 }}
              />
            ) : null}
          </Stack>

          <Typography variant="h6" fontWeight={950} sx={{ lineHeight: 1.15 }}>
            {m?.title}
          </Typography>

          <Typography sx={{ opacity: 0.86, lineHeight: 1.55 }}>
            {m?.park?.blurb}
          </Typography>
        </Stack>
      </MotionBox>
    </Reveal>
  );
}

export default function ManifestoAct({ completed, onStamp }) {
  const reduceMotion = useReducedMotion();
  const burstKey = useBurstOnComplete(completed);

  const midway = React.useMemo(
    () => modules.filter((m) => getArea(m) === "The Midway"),
    []
  );
  const exit = React.useMemo(() => modules.filter((m) => getArea(m) === "Exit"), []);

  return (
    <Stack spacing={2.25}>
      {/* ===== HERO LANE (centers the container regardless of parent layout) ===== */}
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <MotionBox
          initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          whileHover={reduceMotion ? undefined : { scale: 1.008, rotate: -0.15 }}
          style={{ transformOrigin: "center" }}
          sx={{
            width: "min(1180px, 100%)",
            position: "relative",
            height: { xs: 320, sm: 380, md: 460, lg: 520 },
            borderRadius: 3,
            overflow: "hidden",
            border: "2px solid rgba(250,204,21,0.20)",
            boxShadow: "0 22px 70px rgba(0,0,0,0.55)",
            backgroundImage: `
              radial-gradient(900px 420px at 30% 10%, rgba(250,204,21,0.10), transparent 65%),
              radial-gradient(900px 420px at 70% 20%, rgba(225,29,72,0.10), transparent 65%)
            `,
          }}
        >
          {/* breathing / drift */}
          <MotionBox
            aria-hidden
            animate={
              reduceMotion
                ? undefined
                : {
                    boxShadow: [
                      "0 22px 70px rgba(0,0,0,0.55)",
                      "0 28px 90px rgba(0,0,0,0.62)",
                      "0 22px 70px rgba(0,0,0,0.55)",
                    ],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }
            }
            sx={{ position: "absolute", inset: 0 }}
          />

          {/* sign “float” */}
          <MotionBox
            animate={
              reduceMotion ? undefined : { y: [0, -6, 0], rotate: [0, 0.35, 0] }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 7.2, repeat: Infinity, ease: "easeInOut" }
            }
            sx={{ position: "absolute", inset: 0 }}
          >
            <Image
              src="/sign.png"
              alt="Carnival Rules & Policies"
              fill
              priority
              style={{ objectFit: "contain" }}
            />
          </MotionBox>

          {/* vignette for readability */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(closest-side at 50% 55%, rgba(0,0,0,0.10), rgba(0,0,0,0.62))",
            }}
          />

          {/* spotlight sweep */}
          <MotionBox
            aria-hidden
            initial={{ x: "-55%", opacity: 0 }}
            animate={
              reduceMotion
                ? { opacity: 0 }
                : { x: ["-55%", "55%"], opacity: [0, 0.35, 0] }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 5.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 1.0,
                  }
            }
            sx={{
              position: "absolute",
              top: "-10%",
              bottom: "-10%",
              width: "55%",
              pointerEvents: "none",
              background:
                "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.22) 45%, transparent 60%)",
              filter: "blur(2px)",
              mixBlendMode: "screen",
            }}
          />

          {/* sparkles */}
          {!reduceMotion &&
            SPARKLES.map((s, i) => (
              <MotionBox
                key={i}
                aria-hidden
                sx={{
                  position: "absolute",
                  top: s.top,
                  left: s.left,
                  width: s.size,
                  height: s.size,
                  borderRadius: 999,
                  backgroundColor: "rgba(250,204,21,0.95)",
                  boxShadow: "0 0 18px rgba(250,204,21,0.55)",
                  filter: "blur(0.2px)",
                  pointerEvents: "none",
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.75, 1.35, 0.75],
                  y: [0, -12, 0],
                }}
                transition={{
                  duration: s.d,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: s.delay,
                }}
              />
            ))}

          {/* text in the sign’s “blank” center */}
          <MotionStack
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
            }}
            sx={{
              position: "absolute",
              left: "50%",
              top: "56%",
              transform: "translate(-50%, -50%)",
              width: { xs: "86%", sm: "78%", md: "70%" },
              maxWidth: 860,
              textAlign: "center",
              px: 1,
            }}
            spacing={1}
          >
            <MotionBox
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: {
                  opacity: 0.92,
                  y: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 13, sm: 14 },
                  textShadow: "0 3px 18px rgba(0,0,0,0.55)",
                }}
              >
                Welcome to the Big Top. Before you touch the rides:
              </Typography>
            </MotionBox>

            <MotionBox
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.99 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.55, ease: "easeOut" },
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 950,
                  lineHeight: 1.05,
                  fontSize: { xs: 26, sm: 32, md: 40 },
                  textShadow: "0 3px 18px rgba(0,0,0,0.55)",
                }}
              >
                The Front Gate Manifesto
              </Typography>
            </MotionBox>

            <MotionBox
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: "easeOut" },
                },
              }}
            >
              <Typography
                sx={{
                  opacity: 0.9,
                  lineHeight: 1.55,
                  fontSize: { xs: 12.5, sm: 13.5, md: 14.5 },
                  textShadow: "0 3px 18px rgba(0,0,0,0.55)",
                }}
              >
                This park turns AI from <b>cool demos</b> into <b>reliable work</b>. Not
                vibes. Not guessing. <b>Verified outputs you can ship.</b>
                <br />
                <span style={{ opacity: 0.92 }}>
                  AI is power steering, not autopilot — you still drive, you still own the
                  crash.
                </span>
              </Typography>
            </MotionBox>

            <MotionBox
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: "easeOut" },
                },
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", justifyContent: "center" }}
              >
                {["Trust nothing", "Verify everything", "Format it so it can’t wiggle"].map(
                  (t, idx) => (
                    <motion.div
                      key={t}
                      whileHover={
                        reduceMotion ? undefined : { y: -2, rotate: idx === 1 ? 0.4 : -0.4 }
                      }
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    >
                      <Chip
                        size="small"
                        label={t}
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.25)",
                          border: "1px solid rgba(255,255,255,0.16)",
                          backdropFilter: "blur(6px)",
                        }}
                      />
                    </motion.div>
                  )
                )}
              </Stack>
            </MotionBox>
          </MotionStack>
        </MotionBox>
      </Box>

      {/* ===== QUICK RULES (DECK-ERA OPENING) ===== */}
      <Stack spacing={1.25}>
        <Reveal delay={0.02}>
          <SectionTitle icon="🔥">The Gatekeeping Rule</SectionTitle>
        </Reveal>

        <RuleRow
          delay={0.06}
          n={1}
          title="Tool purity is a trap."
          body={
            <>
              “If you use AI you’re not a real ____” is gatekeeping dressed up as a standard.
              We’re not here for vibes — we’re here for outcomes and accountability.
            </>
          }
        />

        <RuleRow
          delay={0.12}
          n={2}
          title="Abstractions are the entire job."
          body={
            <>
              Unless you’re coding in <b>0s and 1s</b>, you already live on layers: compilers,
              frameworks, libraries, Google, StackOverflow. AI is just the newest abstraction
              layer — the skill is <b>judgment</b>.
            </>
          }
        />

        <RuleRow
          delay={0.18}
          n={3}
          title="Leverage is allowed. Chaos is not."
          body={
            <>
              We use AI because it helps a small team ship like a big one. But “paste and
              pray” is not a workflow — AI just helps you pray faster.
            </>
          }
        />
      </Stack>

      {/* ===== FULL BRIEFING (DECK SPINE → PARK OVERVIEW) ===== */}
      <Reveal delay={0.06} y={10}>
        <Accordion
          disableGutters
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            border: "1px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.18)",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.8)" }} />}
            sx={{
              "&:hover .MuiTypography-root": { opacity: 1 },
            }}
            component={motion.div}
            whileHover={reduceMotion ? undefined : { x: 2 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
          >
            <Stack spacing={0.25}>
              <Typography fontWeight={950}>Full Briefing: how the park works</Typography>
              <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                What AI is, why it fails, the professional rules, and what each tent teaches.
              </Typography>
            </Stack>
          </AccordionSummary>

          <AccordionDetails>
            <Stack spacing={2}>
              <Reveal delay={0.02}>
                <Box sx={CARD_SX}>
                  <SectionTitle icon="🧠">What AI is (and why it fails)</SectionTitle>
                  <Typography sx={{ opacity: 0.88, lineHeight: 1.6, mt: 1 }}>
                    AI doesn’t output truth — it outputs <b>plausible</b>. That’s why it can be
                    brilliant and confidently wrong, especially when:
                  </Typography>

                  <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                    {[
                      "Your ask is vague or missing constraints.",
                      "Critical context isn’t provided, so the model guesses.",
                      "Bad assumptions sneak in and get amplified.",
                      "Sensitive data is dumped into prompts without thinking.",
                      "Inputs/outputs aren’t treated as untrusted (prompt injection).",
                    ].map((t, i) => (
                      <Reveal key={t} delay={0.06 + i * 0.03} y={10}>
                        <Typography sx={{ opacity: 0.86 }}>• {t}</Typography>
                      </Reveal>
                    ))}
                  </Stack>
                </Box>
              </Reveal>

              <Reveal delay={0.05}>
                <Box sx={CARD_SX}>
                  <SectionTitle icon="🎟️">How to win in this park</SectionTitle>

                  <Divider sx={{ my: 1.25, borderColor: "rgba(255,255,255,0.14)" }} />

                  <Stack spacing={1}>
                    {[
                      {
                        n: 1,
                        t: "Frame the ask",
                        d: "Define success, constraints, examples, and what “done” looks like.",
                      },
                      {
                        n: 2,
                        t: "Ground the answer",
                        d: "Prefer sources/known context over vibes. If it matters, require receipts.",
                      },
                      {
                        n: 3,
                        t: "Force structure",
                        d: "Use schemas, checklists, and formats that are easy to validate.",
                      },
                      {
                        n: 4,
                        t: "Verify before you trust",
                        d: "Cross-check, sanity-check, test. Fluency is not correctness.",
                      },
                      {
                        n: 5,
                        t: "Operate safely",
                        d: "Minimize sensitive data. Treat AI like an attack surface. Add guardrails + fallbacks.",
                      },
                    ].map((r, i) => (
                      <Reveal key={r.n} delay={0.06 + i * 0.04} y={12}>
                        <MotionBox
                          whileHover={
                            reduceMotion ? undefined : { y: -4, rotate: i % 2 ? -0.12 : 0.12 }
                          }
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: "1px dashed rgba(255,255,255,0.18)",
                            backgroundColor: "rgba(0,0,0,0.18)",
                          }}
                        >
                          <Typography fontWeight={950}>
                            {r.n}) {r.t}
                          </Typography>
                          <Typography sx={{ opacity: 0.86, mt: 0.4 }}>{r.d}</Typography>
                        </MotionBox>
                      </Reveal>
                    ))}
                  </Stack>
                </Box>
              </Reveal>

              <Reveal delay={0.08}>
                <Box sx={CARD_SX}>
                  <SectionTitle icon="🗺️">What each tent teaches</SectionTitle>
                  <Typography sx={{ opacity: 0.84, mt: 0.75, lineHeight: 1.55 }}>
                    Every act is one skill: stronger prompts, better grounding, safer inputs,
                    cleaner structure, and verification habits that reduce hallucinations.
                  </Typography>

                  <Divider sx={{ my: 1.25, borderColor: "rgba(255,255,255,0.14)" }} />

                  {midway.length ? (
                    <>
                      <Reveal delay={0.02} y={10}>
                        <Typography fontWeight={950} sx={{ mb: 1 }}>
                          The Midway
                        </Typography>
                      </Reveal>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                          gap: 1.25,
                        }}
                      >
                        {midway.map((m, i) => (
                          <TentPreviewCard key={m.id} m={m} delay={0.06 + i * 0.05} />
                        ))}
                      </Box>
                    </>
                  ) : null}

                  {exit.length ? (
                    <>
                      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.14)" }} />
                      <Reveal delay={0.02} y={10}>
                        <Typography fontWeight={950} sx={{ mb: 1 }}>
                          Exit
                        </Typography>
                      </Reveal>

                      <Stack spacing={1.25}>
                        {exit.map((m, i) => (
                          <TentPreviewCard key={m.id} m={m} delay={0.06 + i * 0.05} />
                        ))}
                      </Stack>
                    </>
                  ) : null}

                  <Reveal delay={0.08} y={10}>
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.25,
                        borderRadius: 2,
                        border: "1px dashed rgba(250,204,21,0.28)",
                        backgroundColor: "rgba(250,204,21,0.06)",
                      }}
                    >
                      <Typography sx={{ fontSize: 13, opacity: 0.9 }}>
                        2026 reality check: the shift isn’t “AI can write.” It’s “AI can operate.”
                        More capability → more responsibility → more need for boundaries.
                      </Typography>
                    </Box>
                  </Reveal>
                </Box>
              </Reveal>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Reveal>

      {/* ===== STAMP CTA ===== */}
      <Box sx={{ position: "relative" }}>
        <StampBurst burstKey={burstKey} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flexWrap: "wrap" }}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Reveal delay={0.04} y={10}>
            {completed ? (
              <Chip
                label="✅ Entry Ticket Stamped"
                sx={{
                  border: "1px solid rgba(250,204,21,0.35)",
                  backgroundColor: "rgba(250,204,21,0.10)",
                  justifyContent: "center",
                }}
              />
            ) : (
              <Chip
                label="🔒 Stamp required to enter Midway"
                sx={{
                  border: "1px dashed rgba(225,29,72,0.55)",
                  backgroundColor: "rgba(0,0,0,0.18)",
                  justifyContent: "center",
                }}
              />
            )}
          </Reveal>

          <Button
            component={motion.button}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98, rotate: -0.3 }}
            animate={
              reduceMotion || completed
                ? undefined
                : { y: [0, -1.5, 0], rotate: [0, -0.2, 0.2, 0] }
            }
            transition={
              reduceMotion || completed
                ? undefined
                : { duration: 3.8, repeat: Infinity, ease: "easeInOut" }
            }
            onClick={() => {
              if (!completed) onStamp?.();
            }}
            disabled={Boolean(completed)}
            variant="contained"
            sx={{
              borderRadius: 999,
              px: 3,
              backgroundImage:
                "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
              opacity: completed ? 0.8 : 1,
            }}
          >
            {completed ? "Ticket Already Stamped" : "Stamp Entry Ticket"}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}