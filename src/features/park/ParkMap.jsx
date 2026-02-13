"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Container, Stack, Typography, Chip, Button } from "@mui/material";
import Grid from "@mui/material/Grid";

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

export default function ParkMap() {
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

  const renderRide = (m, { showAreaChip = false } = {}) => {
    const Icon = ICONS[m.park?.icon] || MapIcon;
    const isDone = Boolean(answers[m.id]);
    const area = getArea(m);

    return (
      <TentCard
        cardSx={{ height: "100%" }}
        // ✅ give the trapezoid walls “safe area”
        contentSx={{ pt: 3, px: { xs: 3, sm: 4 } }}
      >
        <Stack spacing={1.2} alignItems="center" textAlign="center">
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{
              width: "100%",
              px: 1, // ✅ keeps top row away from slanted edges
              flexWrap: "wrap",
            }}
          >
            <Icon fontSize="small" />
            <Typography fontWeight={900}>
              {m.park?.attraction || m.title}
            </Typography>

            {showAreaChip && area ? (
              <Chip
                size="small"
                label={area}
                variant="outlined"
                sx={{ opacity: 0.85 }}
              />
            ) : null}

            {isDone ? <Chip size="small" label="✅ Done" variant="filled" /> : null}
          </Stack>

          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              lineHeight: 1.2,
              maxWidth: "92%", // ✅ prevents long titles from hitting the walls
              mx: "auto",
            }}
          >
            {m.title}
          </Typography>

          <Typography
            sx={{
              opacity: 0.85,
              maxWidth: "92%", // ✅ same idea for blurb
              mx: "auto",
            }}
          >
            {m.park?.blurb}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ flexWrap: "wrap" }}
          >
            {m.park?.time ? (
              <Chip size="small" label={m.park.time} variant="outlined" />
            ) : null}
            {m.park?.level ? (
              <Chip size="small" label={m.park.level} variant="outlined" />
            ) : null}
          </Stack>

          <Box
            sx={{
              width: "100%",
              pt: 1,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              component={Link}
              href={`/workshop?start=${m.id}`}
              variant="contained"
              sx={{ width: "100%", maxWidth: 260 }}
            >
              Enter
            </Button>
          </Box>
        </Stack>
      </TentCard>
    );
  };

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
        {/* HERO */}
        <Box
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
          <Grid container spacing={2} alignItems="center" sx={{ position: "relative" }}>
            <Grid size={{ xs: 12, md: 8 }}>
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
        </Box>

        <Stack spacing={5}>
          {/* FRONT GATE */}
          {frontGateRides.length ? (
            <Box>
              <Typography variant="h4" fontWeight={950} sx={{ mb: 2, textAlign: "center" }}>
                Front Gate
              </Typography>

              <Grid container spacing={3} justifyContent="center" sx={{ mx: "auto", maxWidth: 720 }}>
                {frontGateRides.map((m) => (
                  <Grid key={m.id} size={12} sx={{ display: "flex", justifyContent: "center" }}>
                    <Box sx={{ width: "100%", maxWidth: 620, minWidth: 0 }}>
                      {renderRide(m)}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : null}

          {/* THE MIDWAY */}
          <Box>
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
              {otherRides.map((m) => (
                <Grid
                  key={m.id}
                  // ✅ force 2-up layout from sm and up
                  size={{ xs: 12, sm: 6 }}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: { xs: 560, lg: 520, xl: 560 },
                      minWidth: 0,
                    }}
                  >
                    {renderRide(m, { showAreaChip: true })}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}