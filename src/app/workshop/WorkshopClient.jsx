// src/app/workshop/WorkshopClient.jsx

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
} from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

// ✅ Canonical source of truth (explicit .js)
import modules, {
  FRONT_GATE_ID,
  getArea,
  requiresFrontGate,
} from "@/features/carnival/modules.js";

// ✅ Storage (explicit .js)
import { loadState, saveState } from "@/features/workshop/storage.js";

// ✅ Canonical acts
import ManifestoAct from "@/features/carnival/acts/ManifestoAct.jsx";
import DunkTankAct from "@/features/carnival/acts/DunkTankAct.jsx";
import GoldfishBowlTossAct from "@/features/carnival/acts/GoldfishBowlTossAct.jsx";
import EmailShootingGalleryAct from "@/features/carnival/acts/EmailShootingGalleryAct.jsx";

// ✅ Placeholders for pending acts
import StubAct from "@/features/workshop/acts/StubAct.jsx";

const MotionBox = motion(Box);

// ✅ set this to wherever ParkMap lives
const RETURN_HREF = "/"; // e.g. "/" or "/park"

function findModuleIndexById(start) {
  if (!start) return -1;
  const s = String(start);
  return modules.findIndex((m) => String(m.id) === s);
}

function isCompleteForModule(module, storedAnswer) {
  if (!module) return false;
  if (!storedAnswer) return false;

  // Dunk tank is only “complete” once a shot exists
  if (module.type === "dunk_tank") {
    if (typeof storedAnswer === "object" && storedAnswer) return Boolean(storedAnswer.shot);
    if (typeof storedAnswer === "string") return Boolean(storedAnswer);
    return false;
  }

  // Everything else: any truthy stored value counts as complete
  return true;
}

export default function WorkshopClient() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const search = useSearchParams();

  const start = search.get("start");
  const isSingle = Boolean(start);

  const [hydrated, setHydrated] = React.useState(false);

  const [answers, setAnswers] = React.useState({});
  const [idx, setIdx] = React.useState(0);
  const [tickets, setTickets] = React.useState(0);

  const [justWonTicket, setJustWonTicket] = React.useState(false);

  const persist = React.useCallback((patch) => {
    const existing = loadState() || {};
    saveState({ ...existing, ...patch });
  }, []);

  // ✅ Hydrate from local storage (client-only)
  React.useEffect(() => {
    const saved = loadState() || {};
    const savedAnswers = saved.answers || {};
    const savedIdx = Number.isFinite(saved.idx) ? saved.idx : 0;

    const initTickets = Number.isFinite(saved.tickets)
      ? saved.tickets
      : Object.keys(savedAnswers).length;

    setAnswers(savedAnswers);
    setIdx(savedIdx);
    setTickets(initTickets);
    setHydrated(true);
  }, []);

  const completed = Object.keys(answers).length;
  const frontGateComplete = Boolean(answers?.[FRONT_GATE_ID]);

  const frontGateIndex = React.useMemo(
    () => modules.findIndex((m) => String(m.id) === String(FRONT_GATE_ID)),
    []
  );

  const activeIndex = React.useMemo(() => {
    if (!isSingle) return idx;
    const i = findModuleIndexById(start);
    return i >= 0 ? i : -1;
  }, [isSingle, start, idx]);

  // Invalid deep-link safety
  React.useEffect(() => {
    if (!hydrated) return;
    if (isSingle && activeIndex < 0) router.replace(RETURN_HREF);
  }, [hydrated, isSingle, activeIndex, router]);

  const activeModule = activeIndex >= 0 ? modules[activeIndex] : null;

  // ✅ Front Gate enforcement — only after hydration
  React.useEffect(() => {
    if (!hydrated) return;
    if (!activeModule) return;
    if (frontGateComplete) return;

    // If user is already on the Front Gate module, don’t redirect
    if (String(activeModule.id) === String(FRONT_GATE_ID)) return;

    // If this module requires Front Gate, force them to the Front Gate
    if (requiresFrontGate(activeModule)) {
      if (isSingle) {
        router.replace(`/workshop?start=${FRONT_GATE_ID}`);
      } else if (frontGateIndex >= 0 && idx !== frontGateIndex) {
        setIdx(frontGateIndex);
        persist({ answers, idx: frontGateIndex, tickets });
      }
    }
  }, [
    hydrated,
    activeModule?.id,
    frontGateComplete,
    isSingle,
    router,
    frontGateIndex,
    idx,
    persist,
    answers,
    tickets,
  ]);

  React.useEffect(() => {
    if (!activeModule) return;
    setJustWonTicket(false);
  }, [activeModule?.id]);

  const safeReturnToMidway = React.useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.replace(RETURN_HREF);
  }, [router]);

  const resetProgress = () => {
    saveState({ answers: {}, idx: 0, tickets: 0 });
    setAnswers({});
    setIdx(0);
    setTickets(0);
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

  // ===== act handlers =====
  const stampManifesto = () => {
    if (!activeModule) return;
    const nextAnswers = {
      ...answers,
      [activeModule.id]: { type: "manifesto", completedAt: Date.now() },
    };
    awardTicketIfFirstCompletion(activeModule.id, nextAnswers);
  };

  const pickDunkShot = (shotId) => {
    if (!activeModule) return;
    const nextAnswers = {
      ...answers,
      [activeModule.id]: { type: "dunk_tank", shot: shotId, completedAt: Date.now() },
    };
    awardTicketIfFirstCompletion(activeModule.id, nextAnswers);
  };

  // Tour nav (won’t bypass Front Gate)
  const goNext = () => {
    const nextIdx = Math.min(modules.length - 1, idx + 1);
    const nextModule = modules[nextIdx];

    if (nextModule && requiresFrontGate(nextModule) && !frontGateComplete) return;

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

  const progressValue = isSingle
    ? 100
    : Math.round(((idx + 1) / Math.max(1, modules.length)) * 100);

  const stored = answers?.[activeModule.id];
  const isComplete = isCompleteForModule(activeModule, stored);

  // Dunk Tank value adapter (supports old “string answer” shape too)
  const dunkValue =
    typeof stored === "object" && stored
      ? stored.shot ?? null
      : typeof stored === "string"
      ? stored
      : null;

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
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 18 }
          }
        >
          {/* Marquee header */}
          <Box
            sx={{
              borderRadius: 3,
              p: { xs: 2, md: 2.5 },
              border: "2px dashed rgba(255,255,255,0.22)",
              backgroundColor: "rgba(0,0,0,0.20)",
              boxShadow: "0 16px 60px rgba(0,0,0,0.35)",
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={0.5}>
                <Typography
                  variant="h5"
                  fontWeight={950}
                  sx={{ letterSpacing: 0.5, textTransform: "uppercase" }}
                >
                  {isSingle ? area : "Guided Tour"}
                </Typography>
                <Typography sx={{ opacity: 0.78 }}>
                  {subtitle} • Acts cleared: {completed}/{modules.length}
                </Typography>

                {!frontGateComplete ? (
                  <Typography sx={{ opacity: 0.75, fontSize: 13, mt: 0.5 }}>
                    Front Gate required: stamp it to unlock the Midway.
                  </Typography>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                <Chip
                  label={`Prize Tickets: ${tickets}`}
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.28)",
                    border: "1px dashed rgba(255,255,255,0.22)",
                    color: "rgba(255,255,255,0.92)",
                  }}
                />

                <Button
                  onClick={resetProgress}
                  variant="outlined"
                  sx={{
                    borderStyle: "dashed",
                    borderColor: "rgba(225,29,72,0.65)",
                    color: "rgba(255,255,255,0.88)",
                    borderRadius: 999,
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
                      borderRadius: 999,
                    }}
                  >
                    Back to Midway
                  </Button>
                ) : null}
              </Stack>
            </Stack>

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
          </Box>

          {/* Body */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
              {title}
            </Typography>

            {/* ✅ Act routing by module.type (canonical) */}
            {activeModule.type === "manifesto" ? (
              <ManifestoAct completed={isComplete} onStamp={stampManifesto} />
            ) : activeModule.type === "dunk_tank" ? (
              <DunkTankAct value={dunkValue} onPick={pickDunkShot} />
            ) : activeModule.type === "bow_toss" ? (
              <GoldfishBowlTossAct
                module={activeModule}
                answer={stored && typeof stored === "object" ? stored : null}
                onComplete={(payload) => {
                  const nextAnswers = {
                    ...answers,
                    [activeModule.id]: { ...payload, completedAt: Date.now() },
                  };
                  awardTicketIfFirstCompletion(activeModule.id, nextAnswers);
                }}
              />
  
  
            ) : activeModule.type === "shooting_gallery" ? (
              <EmailShootingGalleryAct
      module={activeModule}
      answer={stored && typeof stored === "object" ? stored : null}
      onComplete={(payload) => {
        const nextAnswers = { ...answers, [activeModule.id]: payload };
        awardTicketIfFirstCompletion(activeModule.id, nextAnswers);
      }}
    
    />
            ) : activeModule.type === "balloon_dart" ? (
              <StubAct title="Balloon Dart" subtitle="Prompt Security: what’s safe vs not safe" />
            ) : activeModule.type === "prize_counter" ? (
              <StubAct title="Prize Counter" subtitle="Trade your tickets in for a prize" />
            ) : (
              <StubAct title="Unknown Act" subtitle="This tent needs a renderer." />
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
              {isComplete ? (
                <Typography sx={{ opacity: 0.85 }}>
                  {justWonTicket ? "Prize Ticket received." : "Ticket already stamped."} Want to hit the Midway again?
                </Typography>
              ) : (
                <Typography sx={{ opacity: 0.6, fontSize: 13 }}>
                  Complete the act to stamp your ticket.
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