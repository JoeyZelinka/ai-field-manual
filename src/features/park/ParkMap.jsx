// src/features/park/ParkMap.jsx

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Stack,
  Typography,
  Chip,
  Button,
  Modal,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";

import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SecurityIcon from "@mui/icons-material/Security";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import MapIcon from "@mui/icons-material/Map";
import CasinoIcon from "@mui/icons-material/Casino";

import TentCard from "@/features/park/TentCard";

// ✅ Canonical modules
import modules, { FRONT_GATE_ID, getArea } from "@/features/carnival/modules.js";

// ✅ Storage
import { loadState, saveState } from "@/features/workshop/storage.js";

const MotionBox = motion(Box);

const ICONS = {
  fire: LocalFireDepartmentIcon,
  brain: PsychologyAltIcon,
  edit: EditNoteIcon,
  shield: SecurityIcon,
  sparkle: AutoAwesomeIcon,
  gift: CardGiftcardIcon,
};

// 🎪 deterministic tiny “circus tilt” per card id
function tiltForId(id) {
  const s = String(id || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const n = (h % 9) - 4; // -4..+4
  return n * 0.35; // degrees
}

// 🎭 deterministic “from different directions” vectors (the parade entrances)
const ENTRANCES = [
  { x: -140, y: 0, r: -8 },
  { x: 140, y: 0, r: 8 },
  { x: 0, y: -140, r: -6 },
  { x: 0, y: 160, r: 6 },
  { x: -120, y: -120, r: -10 },
  { x: 120, y: -120, r: 10 },
  { x: -120, y: 120, r: 10 },
  { x: 120, y: 120, r: -10 },
];

export default function ParkMap() {
  const reduce = useReducedMotion();
  const router = useRouter();

  const [answers, setAnswers] = React.useState({});
  const [tickets, setTickets] = React.useState(0);

  // 🚫 Lock modal state
  const [lockOpen, setLockOpen] = React.useState(false);
  const [lockTent, setLockTent] = React.useState(null);

  React.useEffect(() => {
    const saved = loadState() || {};
    const a = saved.answers || {};
    const t = Number.isFinite(saved.tickets) ? saved.tickets : Object.keys(a).length;

    setAnswers(a);
    setTickets(t);
  }, []);

  const completed = Object.keys(answers).length;
  const frontGateComplete = Boolean(answers?.[FRONT_GATE_ID]);

  const resetProgress = () => {
    const existing = loadState() || {};
    const next = { ...existing, answers: {}, idx: 0, tickets: 0 };
    saveState(next);
    setAnswers({});
    setTickets(0);
  };

  const frontGateRides = React.useMemo(
    () => modules.filter((m) => getArea(m) === "Front Gate"),
    []
  );

  const midwayRides = React.useMemo(
    () => modules.filter((m) => getArea(m) === "The Midway"),
    []
  );

  const exitRides = React.useMemo(
    () => modules.filter((m) => getArea(m) === "Exit"),
    []
  );

  const goToFrontGate = React.useCallback(() => {
    router.push(`/workshop?start=${FRONT_GATE_ID}`);
  }, [router]);

  const openLockModal = React.useCallback((m) => {
    setLockTent(m || null);
    setLockOpen(true);
  }, []);

  const closeLockModal = React.useCallback(() => {
    setLockOpen(false);
    // clear after animation finishes
    setTimeout(() => setLockTent(null), 200);
  }, []);

  // ========= Scroll “walking the midway” drift =========
  const { scrollY } = useScroll();
  const midwayY = useTransform(scrollY, [0, 1200], reduce ? [0, 0] : [0, -28]);
  const midwayRot = useTransform(scrollY, [0, 1200], reduce ? [0, 0] : [0, -0.6]);

  // ========= Page/Hero/Section Variants =========
  const page = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: reduce ? { duration: 0.01 } : { duration: 0.25 } },
  };

  const floaty = reduce
    ? {}
    : { y: [0, -6, 0], transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" } };

  const heroWrap = {
    hidden: { opacity: 0, y: reduce ? 0 : 18, scale: reduce ? 1 : 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reduce ? { duration: 0.01 } : { type: "spring", stiffness: 190, damping: 18 },
    },
  };

  const section = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduce ? { duration: 0.01 } : { type: "spring", stiffness: 170, damping: 18 },
    },
  };

  // ========= Tent Entrance (per-card) =========
  const card = {
    hidden: (c) => {
      const i = c?.i ?? 0;
      const v = ENTRANCES[i % ENTRANCES.length];

      if (reduce) return { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" };
      return { opacity: 0, x: v.x, y: v.y, rotate: v.r + (c?.tilt ?? 0), scale: 0.92, filter: "blur(6px)" };
    },
    show: (c) => {
      const i = c?.i ?? 0;

      if (reduce) return { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" };
      return {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
          type: "spring",
          stiffness: 520,
          damping: 34,
          mass: 0.9,
          delay: Math.min(0.65, 0.05 * i),
        },
      };
    },
    hover: (c) =>
      reduce
        ? {}
        : {
            rotate: [0, (c?.tilt ?? 0) * 0.35, -(c?.tilt ?? 0) * 0.25, 0],
            scale: 1.02,
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          },
  };

  // ========= Render Ride =========
  const renderRide = (m, { showAreaChip = false, locked = false } = {}) => {
    const Icon = ICONS[m.park?.icon] || MapIcon;
    const isDone = Boolean(answers[m.id]);
    const area = getArea(m);

    // If locked, block ALL navigation and show the pop-up instead
    const handleAttempt = () => openLockModal(m);

    return (
      <Box
        onClick={locked ? handleAttempt : undefined}
        sx={{
          width: "100%",
          cursor: locked ? "not-allowed" : "default",
        }}
      >
        <TentCard
          cardSx={{ height: "100%" }}
          contentSx={{ pt: 3, px: { xs: 3, sm: 4 } }}
        >
          <Stack spacing={1.2} alignItems="center" textAlign="center">
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{ width: "100%", px: 1, flexWrap: "wrap" }}
            >
              <Icon fontSize="small" />
              <Typography fontWeight={900}>{m.park?.attraction || m.title}</Typography>

              {showAreaChip && area ? (
                <Chip size="small" label={area} variant="outlined" sx={{ opacity: 0.85 }} />
              ) : null}

              {locked ? (
                <Chip
                  size="small"
                  label="🔒 Front Gate required"
                  variant="outlined"
                  sx={{ opacity: 0.9 }}
                />
              ) : null}

              {isDone ? <Chip size="small" label="✅ Done" variant="filled" /> : null}
            </Stack>

            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ lineHeight: 1.2, maxWidth: "92%", mx: "auto" }}
            >
              {m.title}
            </Typography>

            <Typography sx={{ opacity: 0.85, maxWidth: "92%", mx: "auto" }}>
              {m.park?.blurb}
            </Typography>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ flexWrap: "wrap" }}>
              {m.park?.time ? <Chip size="small" label={m.park.time} variant="outlined" /> : null}
              {m.park?.level ? <Chip size="small" label={m.park.level} variant="outlined" /> : null}
            </Stack>

            <Box sx={{ width: "100%", pt: 1, display: "flex", justifyContent: "center" }}>
              {locked ? (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAttempt();
                  }}
                  variant="contained"
                  sx={{ width: "100%", maxWidth: 260 }}
                >
                  Enter
                </Button>
              ) : (
                <Button
                  component={Link}
                  href={`/workshop?start=${m.id}`}
                  variant="contained"
                  sx={{ width: "100%", maxWidth: 260 }}
                >
                  Enter
                </Button>
              )}
            </Box>
          </Stack>
        </TentCard>
      </Box>
    );
  };

  // ✅ lock everything except Front Gate until stamped
  const locked = Boolean(frontGateRides.length) && !frontGateComplete;

  return (
    <>
      {/* ================== WACKY LOCK MODAL ================== */}
      <AnimatePresence>
        {lockOpen ? (
          <Modal open={lockOpen} onClose={closeLockModal}>
            <Box
              sx={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                backgroundColor: "rgba(0,0,0,0.55)",
              }}
            >
              <MotionBox
                initial={
                  reduce
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.72, rotate: -8, y: -18 }
                }
                animate={
                  reduce
                    ? { opacity: 1, scale: 1 }
                    : {
                        opacity: 1,
                        scale: 1,
                        rotate: 0,
                        y: 0,
                        transition: { type: "spring", stiffness: 420, damping: 24 },
                      }
                }
                exit={
                  reduce
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.82, rotate: 6, y: 16, transition: { duration: 0.18 } }
                }
                sx={{
                  width: "100%",
                  maxWidth: 560,
                  borderRadius: 3,
                  border: "2px dashed rgba(255,255,255,0.22)",
                  boxShadow: "0 22px 70px rgba(0,0,0,0.65)",
                  overflow: "hidden",
                  backgroundColor: "rgba(18,10,12,0.92)",
                  backgroundImage: `
                    radial-gradient(800px 420px at 30% 0%, rgba(250,204,21,0.18), transparent 60%),
                    radial-gradient(800px 420px at 80% 20%, rgba(225,29,72,0.18), transparent 60%)
                  `,
                }}
              >
                {/* header */}
                <Box sx={{ p: 2.5, borderBottom: "1px dashed rgba(255,255,255,0.16)" }}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <CasinoIcon />
                    <Typography variant="h6" fontWeight={950} sx={{ letterSpacing: 0.4 }}>
                      Nice try.
                    </Typography>
                  </Stack>
                </Box>

                {/* body */}
                <Box sx={{ p: 2.5 }}>
                  <Typography sx={{ opacity: 0.92, mb: 1.2, fontWeight: 850 }}>
                    Trying to sneak into the carnival without going through the Front Gate?
                  </Typography>

                  <Typography sx={{ opacity: 0.86, lineHeight: 1.55 }}>
                    We strap people to the <b>Gravitron</b> all night for that.
                  </Typography>

                  {lockTent ? (
                    <Typography sx={{ mt: 1.5, opacity: 0.8, fontSize: 13 }}>
                      Tent blocked: <b>{lockTent.title}</b>
                    </Typography>
                  ) : null}

                  {!reduce ? (
                    <MotionBox
                      aria-hidden
                      animate={{ rotate: [0, -2, 2, -1, 1, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.6 }}
                      sx={{
                        mt: 2,
                        p: 1.25,
                        borderRadius: 2,
                        border: "1px dashed rgba(250,204,21,0.35)",
                        backgroundColor: "rgba(250,204,21,0.08)",
                      }}
                    >
                      <Typography sx={{ fontSize: 13, opacity: 0.9 }}>
                        🎟️ Stamp your entry ticket and the whole park unlocks.
                      </Typography>
                    </MotionBox>
                  ) : null}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2.5 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        closeLockModal();
                        goToFrontGate();
                      }}
                      sx={{
                        borderRadius: 999,
                        px: 3,
                        backgroundImage:
                          "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
                      }}
                    >
                      Fine. Take me to the Front Gate
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={closeLockModal}
                      sx={{
                        borderRadius: 999,
                        px: 3,
                        borderStyle: "dashed",
                        borderColor: "rgba(255,255,255,0.35)",
                        color: "rgba(255,255,255,0.9)",
                      }}
                    >
                      I’ll behave.
                    </Button>
                  </Stack>
                </Box>
              </MotionBox>
            </Box>
          </Modal>
        ) : null}
      </AnimatePresence>

      {/* ================== PAGE ================== */}
      <MotionBox
        variants={page}
        initial="hidden"
        animate="show"
        sx={{
          minHeight: "100vh",
          width: "100%",
          py: 6,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "rgb(18,10,12)",
          backgroundImage: `
            radial-gradient(1000px 620px at 20% -10%, rgba(250,204,21,0.18), transparent 60%),
            radial-gradient(900px 540px at 85% 10%, rgba(225,29,72,0.20), transparent 58%),
            repeating-linear-gradient(90deg, rgba(225,29,72,0.34) 0 56px, rgba(250,204,21,0.22) 56px 112px),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, rgba(0,0,0,0) 1px 4px)
          `,
          backgroundAttachment: { xs: "scroll", md: "fixed" },
        }}
      >
        {/* ====== Moving circus spotlights ====== */}
        {!reduce ? (
          <>
            <MotionBox
              aria-hidden
              sx={{
                position: "absolute",
                inset: -200,
                pointerEvents: "none",
                opacity: 0.55,
                filter: "blur(32px)",
                mixBlendMode: "screen",
                background: "radial-gradient(closest-side, rgba(250,204,21,0.16), transparent 70%)",
              }}
              animate={{ x: [-80, 120, -40], y: [-60, 30, -20] }}
              transition={{ duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
            <MotionBox
              aria-hidden
              sx={{
                position: "absolute",
                inset: -220,
                pointerEvents: "none",
                opacity: 0.48,
                filter: "blur(38px)",
                mixBlendMode: "screen",
                background: "radial-gradient(closest-side, rgba(225,29,72,0.14), transparent 72%)",
              }}
              animate={{ x: [140, -120, 90], y: [40, -80, 60] }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
            <MotionBox
              aria-hidden
              sx={{
                position: "absolute",
                inset: -240,
                pointerEvents: "none",
                opacity: 0.28,
                filter: "blur(46px)",
                mixBlendMode: "screen",
                background: "radial-gradient(closest-side, rgba(255,255,255,0.10), transparent 70%)",
              }}
              animate={{ x: [-40, 70, -60], y: [120, 40, 90] }}
              transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
          </>
        ) : null}

        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, position: "relative", zIndex: 1 }}>
          {/* ====== HERO ====== */}
<MotionBox
  variants={heroWrap}
  sx={{
    position: "relative",
    borderRadius: 2,
    p: { xs: 3, md: 4 },
    mb: 3,
    overflow: "hidden",
    maxWidth: 1120,
    mx: "auto",
    border: "2px solid rgba(250,204,21,0.20)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
    backgroundImage: `
      radial-gradient(900px 380px at 25% 15%, rgba(250,204,21,0.18), transparent 60%),
      radial-gradient(900px 380px at 80% 25%, rgba(225,29,72,0.16), transparent 55%),
      linear-gradient(135deg, rgba(18,10,12,0.92), rgba(18,10,12,0.55))
    `,
  }}
>
  {/* ====== HERO marquee lights overlay ====== */}
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
    }}
  >
    {/* subtle dotted sheen (helps lights read on dark bg) */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        opacity: 0.18,
        mixBlendMode: "overlay",
        backgroundImage:
          "radial-gradient(circle at 14px 14px, rgba(255,255,255,0.18) 0 1px, transparent 2px)",
        backgroundSize: "24px 24px",
      }}
    />

    {/* top bulbs */}
    {!reduce ? (
      <MotionBox
        aria-hidden
        animate={{ opacity: [0.75, 1, 0.82] }}
        transition={{ duration: 2.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        sx={{
          position: "absolute",
          left: -40,
          right: -40,
          top: 10,
          height: 44,
          opacity: 0.9,
          mixBlendMode: "screen",
          filter: "drop-shadow(0 0 14px rgba(250,204,21,0.28))",
          backgroundImage: `
            radial-gradient(circle at 22px 50%,
              rgba(250,204,21,0.98) 0 4px,
              rgba(250,204,21,0.20) 5px 11px,
              transparent 12px
            )
          `,
          backgroundSize: "44px 44px",
          backgroundRepeat: "repeat-x",
        }}
      />
    ) : (
      <Box
        sx={{
          position: "absolute",
          left: -40,
          right: -40,
          top: 10,
          height: 44,
          opacity: 0.95,
          mixBlendMode: "screen",
          filter: "drop-shadow(0 0 14px rgba(250,204,21,0.28))",
          backgroundImage: `
            radial-gradient(circle at 22px 50%,
              rgba(250,204,21,0.98) 0 4px,
              rgba(250,204,21,0.20) 5px 11px,
              transparent 12px
            )
          `,
          backgroundSize: "44px 44px",
          backgroundRepeat: "repeat-x",
        }}
      />
    )}

    {/* bottom bulbs */}
    {!reduce ? (
      <MotionBox
        aria-hidden
        animate={{ opacity: [0.68, 0.95, 0.78] }}
        transition={{
          duration: 3.1,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
          delay: 0.35,
        }}
        sx={{
          position: "absolute",
          left: -40,
          right: -40,
          bottom: 10,
          height: 44,
          opacity: 0.88,
          mixBlendMode: "screen",
          filter: "drop-shadow(0 0 14px rgba(225,29,72,0.20))",
          backgroundImage: `
            radial-gradient(circle at 22px 50%,
              rgba(225,29,72,0.90) 0 4px,
              rgba(225,29,72,0.16) 5px 11px,
              transparent 12px
            )
          `,
          backgroundSize: "44px 44px",
          backgroundRepeat: "repeat-x",
        }}
      />
    ) : (
      <Box
        sx={{
          position: "absolute",
          left: -40,
          right: -40,
          bottom: 10,
          height: 44,
          opacity: 0.9,
          mixBlendMode: "screen",
          filter: "drop-shadow(0 0 14px rgba(225,29,72,0.20))",
          backgroundImage: `
            radial-gradient(circle at 22px 50%,
              rgba(225,29,72,0.90) 0 4px,
              rgba(225,29,72,0.16) 5px 11px,
              transparent 12px
            )
          `,
          backgroundSize: "44px 44px",
          backgroundRepeat: "repeat-x",
        }}
      />
    )}
  </Box>

  <Grid container spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
    <Grid size={{ xs: 12, md: 8 }}>
      <MotionBox animate={floaty}>
        <Stack spacing={1.2}>
          {/* headline fix */}
          <Typography
            component="h1"
            fontWeight={950}
            sx={{
              lineHeight: { xs: 1.06, sm: 1.03, md: 1.0 },
              fontSize: { xs: 34, sm: 46, md: 58 },
              letterSpacing: { xs: 0.2, md: 0.6 },
              textWrap: "balance",
            }}
          >
            Grant &amp; Henderson’s Misfit Circus and Carnival
          </Typography>

          <Typography sx={{ opacity: 0.9, maxWidth: 720 }}>
            Step right up. Pick an act. Learn at your pace. Leave with better prompts,
            fewer hallucinations, and zero accidental data leaks.
          </Typography>
        </Stack>
      </MotionBox>
    </Grid>

    <Grid size={{ xs: 12, md: 4 }}>
      <Stack spacing={1.2} alignItems={{ xs: "flex-start", md: "flex-end" }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Chip
            label={`Acts cleared: ${completed}/${modules.length}`}
            sx={{
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0,0,0,0.28)",
              border: "1px solid rgba(250,204,21,0.18)",
            }}
          />
          <Chip
            color="secondary"
            label={`Prize Tickets: ${tickets}`}
            sx={{
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0,0,0,0.28)",
              border: "1px solid rgba(225,29,72,0.18)",
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={resetProgress}>
            Reset tickets
          </Button>
        </Stack>
      </Stack>
    </Grid>
  </Grid>
</MotionBox>

          <Stack spacing={12}>
            {/* ====== FRONT GATE ====== */}
            {frontGateRides.length ? (
              <MotionBox variants={section}>
                <Typography variant="h4" fontWeight={950} sx={{ mb: 2.5, textAlign: "center" }}>
                  Front Gate
                </Typography>

                <Grid container spacing={8} justifyContent="center" sx={{ mx: "auto", maxWidth: 720 }}>
                  {frontGateRides.map((m, i) => {
                    const tilt = tiltForId(m.id);
                    const custom = { i, tilt };

                    return (
                      <Grid key={m.id} size={12} sx={{ display: "flex", justifyContent: "center" }}>
                        <MotionBox
                          variants={card}
                          custom={custom}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true, amount: 0.35 }}
                          whileHover="hover"
                          sx={{
                            width: "100%",
                            maxWidth: 620,
                            minWidth: 0,
                            transform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                            willChange: "transform",
                          }}
                        >
                          {renderRide(m)}
                        </MotionBox>
                      </Grid>
                    );
                  })}
                </Grid>
              </MotionBox>
            ) : null}

            {/* ====== THE MIDWAY ====== */}
            <MotionBox variants={section}>
              <Typography id="midway" variant="h4" fontWeight={950} sx={{ mb: 2.5, textAlign: "center" }}>
                The Midway
              </Typography>

              {locked ? (
                <Typography sx={{ textAlign: "center", opacity: 0.85, mb: 2.5, maxWidth: 820, mx: "auto" }}>
                  Front Gate first. Clear it to unlock every tent on the Midway.
                </Typography>
              ) : null}

              <MotionBox style={{ y: midwayY, rotate: midwayRot }}>
                <Grid
                  container
                  justifyContent="center"
                  rowSpacing={{ xs: 8, md: 10 }}
                  columnSpacing={{ xs: 2, sm: 6, md: 10, lg: 14, xl: 22 }}
                  sx={{ mx: "auto", maxWidth: { xs: 1200, xl: 1500 } }}
                >
                  {midwayRides.map((m, i) => {
                    const globalI = i + frontGateRides.length;
                    const tilt = tiltForId(m.id);
                    const custom = { i: globalI, tilt };

                    return (
                      <Grid key={m.id} size={{ xs: 12, sm: 6 }} sx={{ display: "flex", justifyContent: "center" }}>
                        <MotionBox
                          variants={card}
                          custom={custom}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true, amount: 0.35 }}
                          whileHover="hover"
                          sx={{
                            width: "100%",
                            maxWidth: { xs: 560, lg: 520, xl: 560 },
                            minWidth: 0,
                            transform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                            willChange: "transform",
                          }}
                        >
                          {renderRide(m, { showAreaChip: true, locked })}
                        </MotionBox>
                      </Grid>
                    );
                  })}
                </Grid>
              </MotionBox>
            </MotionBox>

            {/* ====== EXIT ====== */}
            {exitRides.length ? (
              <MotionBox variants={section}>
                <Typography variant="h4" fontWeight={950} sx={{ mb: 2.5, textAlign: "center" }}>
                  Exit
                </Typography>

                <Grid container spacing={8} justifyContent="center" sx={{ mx: "auto", maxWidth: 720 }}>
                  {exitRides.map((m, i) => {
                    const globalI = i + frontGateRides.length + midwayRides.length;
                    const tilt = tiltForId(m.id);
                    const custom = { i: globalI, tilt };

                    return (
                      <Grid key={m.id} size={12} sx={{ display: "flex", justifyContent: "center" }}>
                        <MotionBox
                          variants={card}
                          custom={custom}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true, amount: 0.35 }}
                          whileHover="hover"
                          sx={{
                            width: "100%",
                            maxWidth: 620,
                            minWidth: 0,
                            transform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                            willChange: "transform",
                          }}
                        >
                          {renderRide(m, { showAreaChip: true, locked })}
                        </MotionBox>
                      </Grid>
                    );
                  })}
                </Grid>
              </MotionBox>
            ) : null}
          </Stack>
        </Container>
      </MotionBox>
    </>
  );
}