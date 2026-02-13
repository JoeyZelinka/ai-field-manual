"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Container, Stack, Typography, Chip, Button } from "@mui/material";
import Grid from "@mui/material/Grid";
import { motion, useReducedMotion } from "framer-motion";

import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SecurityIcon from "@mui/icons-material/Security";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import MapIcon from "@mui/icons-material/Map";

import TentCard from "@/features/park/TentCard";
import modules from "@/features/workshop/modules";
import { loadState, saveState } from "@/features/workshop/storage";
import { computeScore } from "@/features/workshop/computeScore";

const MotionBox = motion(Box);

const ICONS = {
  fire: LocalFireDepartmentIcon,
  brain: PsychologyAltIcon,
  edit: EditNoteIcon,
  shield: SecurityIcon,
  sparkle: AutoAwesomeIcon,
  gift: CardGiftcardIcon,
};

function getArea(m) {
  return m.park?.area || "Park";
}

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
  { x: -140, y: 0, r: -8 },      // left
  { x: 140, y: 0, r: 8 },        // right
  { x: 0, y: -140, r: -6 },      // top
  { x: 0, y: 160, r: 6 },        // bottom
  { x: -120, y: -120, r: -10 },  // top-left
  { x: 120, y: -120, r: 10 },    // top-right
  { x: -120, y: 120, r: 10 },    // bottom-left
  { x: 120, y: 120, r: -10 },    // bottom-right
];

export default function ParkMap() {
  const reduce = useReducedMotion();
  const [answers, setAnswers] = React.useState({});

  React.useEffect(() => {
    const saved = loadState();
    if (saved?.answers) setAnswers(saved.answers);
  }, []);

  const score = React.useMemo(() => computeScore(answers), [answers]);
  const completed = Object.keys(answers).length;

  const resetProgress = () => {
    const existing = loadState() || {};
    const next = { ...existing, answers: {}, idx: 0 };
    saveState(next);
    setAnswers({});
  };

  const frontGateRides = React.useMemo(
    () => modules.filter((m) => getArea(m) === "Front Gate"),
    []
  );

  const otherRides = React.useMemo(
    () => modules.filter((m) => getArea(m) !== "Front Gate"),
    []
  );

  // ========= Page/Hero/Section Variants =========
  const page = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: reduce ? { duration: 0.01 } : { duration: 0.25 } },
  };

  const floaty = reduce
    ? {}
    : {
        y: [0, -6, 0],
        transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
      };

  const heroWrap = {
    hidden: { opacity: 0, y: reduce ? 0 : 18, scale: reduce ? 1 : 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reduce
        ? { duration: 0.01 }
        : { type: "spring", stiffness: 190, damping: 18 },
    },
  };

  const section = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduce
        ? { duration: 0.01 }
        : { type: "spring", stiffness: 170, damping: 18 },
    },
  };

  // ========= Tent Entrance (per-card) =========
  // IMPORTANT: We run this per-card (initial/animate) so it works even though Grid/Container
  // are not motion parents for staggerChildren.
  const card = {
    hidden: (c) => {
      const i = c?.i ?? 0;
      const v = ENTRANCES[i % ENTRANCES.length];

      if (reduce) {
        return { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" };
      }

      return {
        opacity: 0,
        x: v.x,
        y: v.y,
        rotate: v.r + (c?.tilt ?? 0),
        scale: 0.92,
        filter: "blur(6px)",
      };
    },
    show: (c) => {
      const i = c?.i ?? 0;

      if (reduce) {
        return { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" };
      }

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
          // gentle parade stagger (capped so big lists don’t take forever)
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
  const renderRide = (m, { showAreaChip = false } = {}) => {
    const Icon = ICONS[m.park?.icon] || MapIcon;
    const isDone = Boolean(answers[m.id]);
    const area = getArea(m);

    return (
      <TentCard cardSx={{ height: "100%" }} contentSx={{ pt: 3, px: { xs: 3, sm: 4 } }}>
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

            {isDone ? <Chip size="small" label="✅ Done" variant="filled" /> : null}
          </Stack>

          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, maxWidth: "92%", mx: "auto" }}>
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
            <Button component={Link} href={`/workshop?start=${m.id}`} variant="contained" sx={{ width: "100%", maxWidth: 260 }}>
              Enter
            </Button>
          </Box>
        </Stack>
      </TentCard>
    );
  };

  return (
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
        {/* ====== HERO (UNCHANGED — kept exactly) ====== */}
        <MotionBox
          variants={heroWrap}
          sx={{
            position: "relative",
            borderRadius: 1,
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
          {!reduce ? (
            <MotionBox
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                borderRadius: "inherit",
                opacity: 0.22,
                mixBlendMode: "screen",
                backgroundImage: `
                  radial-gradient(circle,
                    rgba(255,236,160,0.22) 0 2px,
                    rgba(250,204,21,0.10) 3px,
                    transparent 7px
                  )
                `,
                backgroundSize: "28px 28px",
              }}
              style={{ backgroundPosition: "10px 10px" }}
              animate={{ backgroundPosition: ["10px 10px", "62px 34px", "10px 10px"] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          ) : null}

          <Grid container spacing={2} alignItems="center" sx={{ position: "relative" }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <MotionBox animate={floaty}>
                <Stack spacing={1.2}>
                  <Typography
                    variant="h2"
                    fontWeight={950}
                    sx={{ lineHeight: 1, textShadow: "0 2px 18px rgba(250,204,21,0.10)" }}
                  >
                    AI Big Top
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
                    label={`Tickets: ${score}`}
                    sx={{
                      backdropFilter: "blur(6px)",
                      backgroundColor: "rgba(0,0,0,0.28)",
                      border: "1px solid rgba(225,29,72,0.18)",
                    }}
                  />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Button component={Link} href="/workshop" variant="contained">
                    Ringmaster Tour
                  </Button>
                  <Button variant="outlined" onClick={resetProgress}>
                    Reset tickets
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </MotionBox>

        <Stack spacing={5}>
          {/* ====== FRONT GATE ====== */}
          {frontGateRides.length ? (
            <MotionBox variants={section}>
              <Typography variant="h4" fontWeight={950} sx={{ mb: 2, textAlign: "center" }}>
                Front Gate
              </Typography>

              <Grid container spacing={3} justifyContent="center" sx={{ mx: "auto", maxWidth: 720 }}>
                {frontGateRides.map((m, i) => {
                  const tilt = tiltForId(m.id);
                  const custom = { i, tilt };

                  return (
                    <Grid key={m.id} size={12} sx={{ display: "flex", justifyContent: "center" }}>
                      <MotionBox
                        variants={card}
                        custom={custom}
                        initial="hidden"
                        animate="show"
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
            <Typography variant="h4" fontWeight={950} sx={{ mb: 2, textAlign: "center" }}>
              The Midway
            </Typography>

            <Grid
              container
              justifyContent="center"
              rowSpacing={5}
              columnSpacing={{ xs: 2, sm: 6, md: 10, lg: 14, xl: 22 }}
              sx={{ mx: "auto", maxWidth: { xs: 1200, xl: 1500 } }}
            >
              {otherRides.map((m, i) => {
                const globalI = i + frontGateRides.length;
                const tilt = tiltForId(m.id);
                const custom = { i: globalI, tilt };

                return (
                  <Grid key={m.id} size={{ xs: 12, sm: 6 }} sx={{ display: "flex", justifyContent: "center" }}>
                    <MotionBox
                      variants={card}
                      custom={custom}
                      initial="hidden"
                      animate="show"
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
                      {renderRide(m, { showAreaChip: true })}
                    </MotionBox>
                  </Grid>
                );
              })}
            </Grid>
          </MotionBox>
        </Stack>
      </Container>
    </MotionBox>
  );
}