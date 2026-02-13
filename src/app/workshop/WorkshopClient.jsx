"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Stack,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Divider,
} from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import modules from "@/features/workshop/modules";
import { loadState, saveState } from "@/features/workshop/storage";

const MotionBox = motion(Box);

// ✅ set this to wherever ParkMap lives
const RETURN_HREF = "/"; // e.g. "/" or "/park"

function findModuleIndex(start) {
  if (!start) return -1;
  const s = String(start);
  return modules.findIndex((m) => String(m.id) === s || String(m.slug ?? "") === s);
}

function getArea(m) {
  return m?.park?.area || "Park";
}

function getChoices(m) {
  return (
    m?.choices ||
    m?.options ||
    m?.answers ||
    m?.responses ||
    m?.prompt?.choices ||
    []
  );
}

/** ---------- Heckler Booth content (Module 1: Tool Purity) ---------- */
const HECKLER = {
  title: "Heckler Booth",
  intro:
    "A carnival heckler shouts: “If you use AI, you’re not a real ____.” Build a 3-part comeback. Principle + analogy + a closing argument that ends the debate.",
  principle: [
    {
      id: "outcomes",
      label: "Outcomes > methods",
      text: "Real work is outcomes—clarity, correctness, impact—not the amount of manual suffering.",
    },
    {
      id: "leverage",
      label: "Tools are leverage",
      text: "Tools are leverage. Skill is knowing what to delegate and what to own.",
    },
    {
      id: "craft",
      label: "Craft includes judgment",
      text: "Craft is judgment: choosing the right approach, verifying results, and improving the final product.",
    },
  ],
  analogy: [
    {
      id: "calculator",
      label: "Calculator",
      text: "Using a calculator doesn’t make you ‘not a real’ mathematician—it lets you focus on the problem.",
    },
    {
      id: "power_tools",
      label: "Power tools",
      text: "A carpenter with power tools isn’t cheating—it’s faster with the same responsibility for quality.",
    },
    {
      id: "ide",
      label: "IDE / autocomplete",
      text: "An IDE doesn’t replace thinking; it removes busywork so you can think harder about what matters.",
    },
  ],

  // ✅ NEW: Closing Argument (snarky/punky/misfit, still workplace-safe)
  closing: [
    {
      id: "ship_it",
      label: "Ship it",
      text: "Anyway—I'm here to ship results. Catch up or clear the lane.",
    },
    {
      id: "gatekeeping",
      label: "Gatekeeping is a hobby",
      text: "Gatekeeping is a hobby. I’ve got deadlines.",
    },
    {
      id: "receipts",
      label: "Bring receipts",
      text: "If it’s wrong, I’ll fix it. If it’s right, I’ll take the win. Bring receipts.",
    },
    {
      id: "call_the_shot",
      label: "I own the outcome",
      text: "I own the outcome—tools don’t get credit, and they don’t take the blame.",
    },
    {
      id: "stay_mad",
      label: "Stay mad",
      text: "Stay mad. I’ll stay effective.",
    },
    {
      id: "standards",
      label: "Standards > vibes",
      text: "Standards beat vibes. I’ll use whatever meets the bar and document the rest.",
    },
  ],
};

function isToolPurityModule(m) {
  const t = String(m?.title ?? "").toLowerCase();
  // Guarded so it only hits the Front Gate “Tool Purity…” act
  return getArea(m) === "Front Gate" && t.includes("tool purity");
}

function findById(list, id) {
  return list.find((x) => x.id === id) || null;
}

function buildComeback({ principle, analogy, closing }) {
  const p = findById(HECKLER.principle, principle)?.text ?? "";
  const a = findById(HECKLER.analogy, analogy)?.text ?? "";
  const c = findById(HECKLER.closing, closing)?.text ?? "";

  // Short, punchy, confident.
  return `${p} ${a} ${c}`.replace(/\s+/g, " ").trim();
}

export default function WorkshopPage() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const search = useSearchParams();

  const start = search.get("start");
  const isSingle = Boolean(start);

  const [answers, setAnswers] = React.useState({});
  const [idx, setIdx] = React.useState(0);

  // Prize Tickets (persistent)
  const [tickets, setTickets] = React.useState(0);

  // Classic-choice module state
  const [selected, setSelected] = React.useState(null);

  // Heckler Booth state (module-specific)
  const [heckler, setHeckler] = React.useState({
    principle: null,
    analogy: null,
    closing: null, // ✅ renamed
  });
  const [justWonTicket, setJustWonTicket] = React.useState(false);

  const persist = React.useCallback((patch) => {
    const existing = loadState() || {};
    saveState({ ...existing, ...patch });
  }, []);

  React.useEffect(() => {
    const saved = loadState() || {};
    const savedAnswers = saved.answers || {};
    const savedIdx = Number.isFinite(saved.idx) ? saved.idx : 0;

    // Back-compat: if tickets not present, initialize to # completed modules.
    const initTickets =
      Number.isFinite(saved.tickets) ? saved.tickets : Object.keys(savedAnswers).length;

    setAnswers(savedAnswers);
    setIdx(savedIdx);
    setTickets(initTickets);
  }, []);

  const completed = Object.keys(answers).length;

  const activeIndex = React.useMemo(() => {
    if (!isSingle) return idx;
    const i = findModuleIndex(start);
    return i >= 0 ? i : -1;
  }, [isSingle, start, idx]);

  React.useEffect(() => {
    if (isSingle && activeIndex < 0) router.replace(RETURN_HREF);
  }, [isSingle, activeIndex, router]);

  const activeModule = activeIndex >= 0 ? modules[activeIndex] : null;

  React.useEffect(() => {
    if (!activeModule) return;

    setJustWonTicket(false);

    // If this is the Tool Purity module, hydrate heckler state from stored answer (if any).
    if (isToolPurityModule(activeModule)) {
      const a = answers?.[activeModule.id];
      if (a && typeof a === "object") {
        setHeckler({
          principle: a.principle ?? null,
          analogy: a.analogy ?? null,
          closing: a.closing ?? null, // ✅ renamed
        });
      } else {
        setHeckler({ principle: null, analogy: null, closing: null });
      }
      setSelected(null);
      return;
    }

    // Otherwise, classic “single selection” module
    setSelected(answers?.[activeModule.id] ?? null);
    setHeckler({ principle: null, analogy: null, closing: null });
  }, [activeModule?.id, answers]);

  const safeReturnToMidway = React.useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.replace(RETURN_HREF);
  }, [router]);

  const resetProgress = () => {
    saveState({ answers: {}, idx: 0, tickets: 0 });
    setAnswers({});
    setIdx(0);
    setTickets(0);
    setSelected(null);
    setHeckler({ principle: null, analogy: null, closing: null });
    setJustWonTicket(false);
  };

  const awardTicketIfFirstCompletion = React.useCallback(
    (moduleId, nextAnswers) => {
      const alreadyCompleted = Boolean(answers?.[moduleId]);
      const nextTickets = alreadyCompleted ? tickets : tickets + 1;

      setTickets(nextTickets);
      setAnswers(nextAnswers);
      persist({ answers: nextAnswers, idx, tickets: nextTickets });

      if (!alreadyCompleted) setJustWonTicket(true);
    },
    [answers, tickets, idx, persist]
  );

  // ---------- Classic-choice modules ----------
  const handlePick = (choiceValue) => {
    if (!activeModule) return;

    setSelected(choiceValue);

    const nextAnswers = { ...answers, [activeModule.id]: choiceValue };

    // Single mode or tour mode: completing a module earns tickets once.
    awardTicketIfFirstCompletion(activeModule.id, nextAnswers);
  };

  // ---------- Heckler Booth module ----------
  const handleHecklerPick = (kind, id) => {
    if (!activeModule) return;

    setHeckler((prev) => {
      const next = { ...prev, [kind]: id };

      const isComplete = Boolean(next.principle && next.analogy && next.closing);
      if (!isComplete) return next;

      const response = buildComeback(next);

      const nextAnswers = {
        ...answers,
        [activeModule.id]: {
          type: "heckler_booth",
          principle: next.principle,
          analogy: next.analogy,
          closing: next.closing, // ✅ renamed
          response,
          completedAt: Date.now(),
        },
      };

      // Award ticket ONLY when they complete all 3 parts (once).
      awardTicketIfFirstCompletion(activeModule.id, nextAnswers);

      return next;
    });
  };

  // Tour navigation (still supported)
  const goNext = () => {
    const nextIdx = Math.min(modules.length - 1, idx + 1);
    setIdx(nextIdx);
    persist({ answers, idx: nextIdx, tickets });
  };

  const goBack = () => {
    const nextIdx = Math.max(0, idx - 1);
    setIdx(nextIdx);
    persist({ answers, idx: nextIdx, tickets });
  };

  if (!activeModule) return null;

  const area = getArea(activeModule);
  const title = activeModule.title ?? "Module";

  const subtitle = isSingle
    ? `${area} • Module ${activeIndex + 1} of ${modules.length}`
    : `Participant Mode • Module ${idx + 1} of ${modules.length}`;

  const isHecklerBooth = isToolPurityModule(activeModule);

  const prompt =
    activeModule.prompt ??
    activeModule.question ??
    activeModule.park?.blurb ??
    "";

  const choices = getChoices(activeModule);

  const progressValue = isSingle
    ? 100
    : Math.round(((idx + 1) / Math.max(1, modules.length)) * 100);

  const hecklerComplete = Boolean(heckler.principle && heckler.analogy && heckler.closing);
  const stored = answers?.[activeModule.id];
  const comeback =
    isHecklerBooth && stored && typeof stored === "object"
      ? (stored.response ?? buildComeback(heckler))
      : "";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        py: 6,
        backgroundColor: "rgb(18,10,12)",
        backgroundImage: `
          radial-gradient(1000px 620px at 20% -10%, rgba(250,204,21,0.18), transparent 60%),
          radial-gradient(900px 540px at 85% 10%, rgba(225,29,72,0.20), transparent 58%),
          repeating-linear-gradient(
            90deg,
            rgba(225,29,72,0.34) 0 56px,
            rgba(250,204,21,0.22) 56px 112px
          ),
          repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.025) 0 1px,
            rgba(0,0,0,0) 1px 4px
          )
        `,
        backgroundAttachment: { xs: "scroll", md: "fixed" },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        <MotionBox
          initial={{ opacity: 0, y: reduce ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 18 }}
          sx={{
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 20px 80px rgba(0,0,0,0.55)",
            backgroundImage: "linear-gradient(135deg, rgba(18,10,12,0.88), rgba(18,10,12,0.62))",
            position: "relative",
          }}
        >
          {/* Top bar */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h5" fontWeight={950}>
                {isSingle ? area : "Guided Tour"}
              </Typography>
              <Typography sx={{ opacity: 0.75 }}>
                {subtitle} • Acts cleared: {completed}/{modules.length}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
              <Chip
                label={`Prize Tickets: ${tickets}`}
                sx={{
                  backgroundColor: "rgba(0,0,0,0.28)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />

              <Button
                onClick={resetProgress}
                variant="outlined"
                sx={{
                  borderStyle: "dashed",
                  borderColor: "rgba(225,29,72,0.65)",
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                Reset
              </Button>

              {isSingle ? (
                <Button
                  onClick={safeReturnToMidway}
                  variant="outlined"
                  sx={{
                    borderStyle: "dashed",
                    borderColor: "rgba(250,204,21,0.55)",
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  Back to Midway
                </Button>
              ) : null}
            </Stack>
          </Stack>

          {/* Progress */}
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 6,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.08)",
                "& .MuiLinearProgress-bar": {
                  backgroundImage:
                    "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
                },
              }}
            />
          </Box>

          {/* Body */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
              {title}
            </Typography>

            {/* ---- Module-specific: Heckler Booth ---- */}
            {isHecklerBooth ? (
              <>
                <Typography sx={{ opacity: 0.9, mb: 2 }}>
                  {HECKLER.intro}
                </Typography>

                {prompt ? (
                  <Typography sx={{ opacity: 0.85, mb: 3 }}>
                    {prompt}
                  </Typography>
                ) : null}

                <Divider sx={{ borderColor: "rgba(255,255,255,0.10)", mb: 3 }} />

                <Stack spacing={2.5}>
                  {/* Principle */}
                  <Box>
                    <Typography fontWeight={900} sx={{ mb: 1 }}>
                      1) Pick a principle
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      {HECKLER.principle.map((p) => {
                        const on = heckler.principle === p.id;
                        return (
                          <Button
                            key={p.id}
                            onClick={() => handleHecklerPick("principle", p.id)}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              borderStyle: "dashed",
                              borderWidth: 2,
                              mb: 1,
                              borderColor: on
                                ? "rgba(250,204,21,0.75)"
                                : "rgba(225,29,72,0.50)",
                              color: on
                                ? "rgba(250,204,21,0.95)"
                                : "rgba(255,255,255,0.85)",
                              backgroundColor: on ? "rgba(250,204,21,0.08)" : "transparent",
                              "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
                            }}
                          >
                            {p.label}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Box>

                  {/* Analogy */}
                  <Box>
                    <Typography fontWeight={900} sx={{ mb: 1 }}>
                      2) Pick an analogy
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      {HECKLER.analogy.map((a) => {
                        const on = heckler.analogy === a.id;
                        return (
                          <Button
                            key={a.id}
                            onClick={() => handleHecklerPick("analogy", a.id)}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              borderStyle: "dashed",
                              borderWidth: 2,
                              mb: 1,
                              borderColor: on
                                ? "rgba(250,204,21,0.75)"
                                : "rgba(225,29,72,0.50)",
                              color: on
                                ? "rgba(250,204,21,0.95)"
                                : "rgba(255,255,255,0.85)",
                              backgroundColor: on ? "rgba(250,204,21,0.08)" : "transparent",
                              "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
                            }}
                          >
                            {a.label}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Box>

                  {/* Closing Argument */}
                  <Box>
                    <Typography fontWeight={900} sx={{ mb: 1 }}>
                      3) Closing argument
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      {HECKLER.closing.map((c) => {
                        const on = heckler.closing === c.id;
                        return (
                          <Button
                            key={c.id}
                            onClick={() => handleHecklerPick("closing", c.id)}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              borderStyle: "dashed",
                              borderWidth: 2,
                              mb: 1,
                              borderColor: on
                                ? "rgba(250,204,21,0.75)"
                                : "rgba(225,29,72,0.50)",
                              color: on
                                ? "rgba(250,204,21,0.95)"
                                : "rgba(255,255,255,0.85)",
                              backgroundColor: on ? "rgba(250,204,21,0.08)" : "transparent",
                              "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
                            }}
                          >
                            {c.label}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Box>

                  {/* Generated comeback */}
                  <Box
                    sx={{
                      mt: 1,
                      p: 2.25,
                      borderRadius: 2,
                      border: "1px dashed rgba(255,255,255,0.20)",
                      backgroundColor: "rgba(0,0,0,0.22)",
                    }}
                  >
                    <Typography fontWeight={900} sx={{ mb: 1 }}>
                      Your comeback
                    </Typography>
                    {hecklerComplete ? (
                      <Typography sx={{ opacity: 0.92, lineHeight: 1.5 }}>
                        “{comeback}”
                      </Typography>
                    ) : (
                      <Typography sx={{ opacity: 0.65 }}>
                        Pick one from each row to generate your response.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </>
            ) : (
              /* ---- Default module: classic choice list ---- */
              <>
                {prompt ? (
                  <Typography sx={{ opacity: 0.9, mb: 3 }}>{prompt}</Typography>
                ) : null}

                <Stack spacing={1.25}>
                  {choices.map((c, i) => {
                    const label =
                      typeof c === "string" ? c : (c.label ?? c.text ?? `Option ${i + 1}`);
                    const value =
                      typeof c === "string" ? c : (c.value ?? c.id ?? label);

                    const isSelected = selected === value;

                    return (
                      <Button
                        key={`${value}-${i}`}
                        fullWidth
                        onClick={() => handlePick(value)}
                        variant="outlined"
                        sx={{
                          py: 1.6,
                          borderRadius: 999,
                          borderStyle: "dashed",
                          borderWidth: 2,
                          borderColor: isSelected
                            ? "rgba(250,204,21,0.70)"
                            : "rgba(225,29,72,0.55)",
                          color: isSelected
                            ? "rgba(250,204,21,0.95)"
                            : "rgba(255,255,255,0.85)",
                          backgroundColor: isSelected ? "rgba(250,204,21,0.08)" : "transparent",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.04)",
                          },
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Stack>
              </>
            )}
          </Box>

          {/* TOUR MODE ONLY */}
          {!isSingle ? (
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
              <Button
                onClick={goBack}
                disabled={idx === 0}
                variant="outlined"
                sx={{ borderRadius: 999, px: 3 }}
              >
                Back
              </Button>

              <Button
                onClick={goNext}
                disabled={idx >= modules.length - 1}
                variant="contained"
                sx={{
                  borderRadius: 999,
                  px: 3,
                  backgroundImage:
                    "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
                }}
              >
                Next
              </Button>
            </Stack>
          ) : null}

          {/* SINGLE MODE: completion + return CTA */}
          {isSingle ? (
            <Stack spacing={1.2} sx={{ mt: 4 }} alignItems="center">
              {isHecklerBooth ? (
                hecklerComplete ? (
                  <Typography sx={{ opacity: 0.85 }}>
                    {justWonTicket ? "Prize Ticket received." : "Ticket already stamped."} Want to hit the Midway again?
                  </Typography>
                ) : (
                  <Typography sx={{ opacity: 0.6, fontSize: 13 }}>
                    Build your comeback to complete this act.
                  </Typography>
                )
              ) : selected != null ? (
                <Typography sx={{ opacity: 0.85 }}>
                  {justWonTicket ? "Prize Ticket received." : "Ticket already stamped."} Want to hit the Midway again?
                </Typography>
              ) : (
                <Typography sx={{ opacity: 0.6, fontSize: 13 }}>
                  Pick an answer to complete this act.
                </Typography>
              )}

              <Button
                onClick={safeReturnToMidway}
                variant="contained"
                sx={{
                  borderRadius: 999,
                  px: 3.5,
                  minWidth: 240,
                  backgroundImage:
                    "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
                }}
              >
                Back to Midway
              </Button>
            </Stack>
          ) : null}
        </MotionBox>

        {/* Optional fallback link */}
        {isSingle ? (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button component={Link} href={RETURN_HREF} sx={{ opacity: 0.75 }}>
              Return to Midway
            </Button>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}