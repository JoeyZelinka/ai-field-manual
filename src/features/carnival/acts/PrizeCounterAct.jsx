// PrizeCounterAct.jsx

"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // ✅ Grid2 matches `size={{...}}`
import { motion, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const DEFAULT_PRIZES = [
  { id: "utm_decoder_ring", name: "UTM Decoder Ring", cost: 1, blurb: "Turns campaign chaos into readable intent.", flavor: "Because someone named it “FINAL_FINAL_v7”." },
  { id: "qa_stamp", name: "QA Rubber Stamp", cost: 1, blurb: "Officially certified “Looks Good On My Machine™”.", flavor: "Works best right before prod deploys." },
  { id: "slack_reaction_pack", name: "Slack Reaction Pack", cost: 1, blurb: "Unlock: 🔥✅🫡🧠🎪", flavor: "Instant morale, zero Jira tickets." },

  { id: "segment_safari_badge", name: "Segment Safari Badge", cost: 2, blurb: "Track and tag elusive audiences in the wild.", flavor: "Warning: may attract lookalike species." },
  { id: "proofing_shield_pin", name: "Proofing Shield Pin", cost: 2, blurb: "Protected from last-minute “tiny” copy edits.", flavor: "Deflects scope creep at close range." },
  { id: "pixel_perfect_loupe", name: "Pixel-Perfect Loupe", cost: 2, blurb: "Finds that 1px misalignment you can’t unsee.", flavor: "Side effects: permanent UI opinions." },
  { id: "deliverability_charm", name: "Deliverability Charm", cost: 2, blurb: "Improves inbox placement by pure superstition.", flavor: "DMARC, SPF, and vibes." },
  { id: "gtm_talisman", name: "GTM Talisman", cost: 2, blurb: "Summons tags without summoning disasters.", flavor: "Also repels ‘mystery double-fires’." },

  { id: "campaign_cape", name: "Campaign Ops Cape", cost: 3, blurb: "For sprint heroes and late-night launches.", flavor: "Not responsible for hero complexes." },
  { id: "persistence_potion", name: "State Persistence Potion", cost: 3, blurb: "Prevents ‘why did it reset?’ incidents.", flavor: "Drink responsibly. Hydrate locally." },
  { id: "stakeholder_amulet", name: "Stakeholder Amulet", cost: 3, blurb: "Converts vague feedback into actionable nouns.", flavor: "Cooldown: 24 hours." },

  { id: "martech_microscope", name: "MarTech Microscope", cost: 4, blurb: "Zooms into attribution until it confesses.", flavor: "You didn’t want last-click anyway." },

  { id: "paign_golden_ticket", name: "Paign Golden Ticket", cost: 5, blurb: "Skip the line. Straight to the build queue.", flavor: "Redeemable for one (1) ‘can you just…’ request." },

  { id: "b_t_black_badge", name: "Block + Tackle Black Badge", cost: 6, blurb: "Ultimate flex. Maximum misfit energy.", flavor: "Grants +10 to shipping velocity." },
];

// Note: we store spent tickets here so WorkshopClient can keep `tickets` as “earned”.
function normalizeAnswer(answer) {
  const a = answer && typeof answer === "object" ? answer : null;

  const mode = a?.mode === "badge" ? "badge" : "spend";
  const ticketsSpent = Number.isFinite(a?.ticketsSpent) ? a.ticketsSpent : 0;

  const claimed =
    a?.claimed && typeof a.claimed === "object" && !Array.isArray(a.claimed)
      ? a.claimed
      : {};

  return {
    type: "prize_counter_v1",
    mode,
    ticketsSpent,
    claimed,
    updatedAt: Number.isFinite(a?.updatedAt) ? a.updatedAt : null,
  };
}

const clamp2 = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

export default function PrizeCounterAct({
  module,
  answer,
  ticketsEarned = 0,
  onSave,

  // ✅ NEW: navigation controls
  onBackToMidway,
  onLeave,

  prizes = DEFAULT_PRIZES,
}) {
  const reduce = useReducedMotion();
  const state = React.useMemo(() => normalizeAnswer(answer), [answer]);

  const [mode, setMode] = React.useState(state.mode);
  const [ticketsSpent, setTicketsSpent] = React.useState(state.ticketsSpent);
  const [claimed, setClaimed] = React.useState(state.claimed);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingPrize, setPendingPrize] = React.useState(null);

  // Keep local state in sync if storage updates externally
  React.useEffect(() => {
    setMode(state.mode);
    setTicketsSpent(state.ticketsSpent);
    setClaimed(state.claimed);
  }, [state.mode, state.ticketsSpent, state.claimed]);

  const claimedCount = Object.keys(claimed).length;

  const ticketsAvailable =
    mode === "spend"
      ? Math.max(0, Number(ticketsEarned) - Number(ticketsSpent))
      : Number(ticketsEarned);

  const canClaim = React.useCallback(
    (p) => {
      if (!p) return false;
      if (claimed?.[p.id]) return false;

      // Badge mode: require earned tickets >= cost (but don’t subtract)
      if (mode === "badge") return ticketsEarned >= p.cost;

      // Spend mode: require available >= cost (subtract on claim)
      return ticketsAvailable >= p.cost;
    },
    [claimed, mode, ticketsAvailable, ticketsEarned]
  );

  const reasonDisabled = React.useCallback(
    (p) => {
      if (!p) return "";
      if (claimed?.[p.id]) return "Already claimed.";
      if (mode === "badge") {
        if (ticketsEarned < p.cost) return "Not enough earned yet.";
        return "";
      }
      if (ticketsAvailable < p.cost) return "Not enough tickets.";
      return "";
    },
    [claimed, mode, ticketsAvailable, ticketsEarned]
  );

  const persist = React.useCallback(
    (next) => {
      if (!onSave) return;
      onSave({
        type: "prize_counter_v1",
        mode: next.mode,
        ticketsSpent: next.ticketsSpent,
        claimed: next.claimed,
        updatedAt: Date.now(),
      });
    },
    [onSave]
  );

  const openConfirm = (p) => {
    setPendingPrize(p);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setPendingPrize(null);
  };

  // ✅ Back to Midway (keeps current state)
  const goToMidway = React.useCallback(() => {
    setConfirmOpen(false);
    setPendingPrize(null);
    onBackToMidway?.();
  }, [onBackToMidway]);

  // ✅ Leave (reset everything upstream + go to Midway)
  const leaveNow = React.useCallback(() => {
    setConfirmOpen(false);
    setPendingPrize(null);
    onLeave?.();
  }, [onLeave]);

  const confirmClaim = () => {
    if (!pendingPrize) return;
    if (!canClaim(pendingPrize)) return;

    const now = Date.now();
    const nextClaimed = {
      ...claimed,
      [pendingPrize.id]: {
        claimedAt: now,
        cost: pendingPrize.cost,
        name: pendingPrize.name,
      },
    };

    const nextSpent =
      mode === "spend"
        ? Number(ticketsSpent) + Number(pendingPrize.cost)
        : Number(ticketsSpent);

    setClaimed(nextClaimed);
    setTicketsSpent(nextSpent);

    persist({
      mode,
      ticketsSpent: nextSpent,
      claimed: nextClaimed,
    });

    closeConfirm();
  };

  const resetClaims = () => {
    const next = { mode, ticketsSpent: 0, claimed: {} };
    setTicketsSpent(0);
    setClaimed({});
    persist(next);
  };

  const setModeAndPersist = (nextMode) => {
    const m = nextMode === "badge" ? "badge" : "spend";
    setMode(m);
    persist({ mode: m, ticketsSpent, claimed });
  };

  const cardVariant = {
    hidden: { opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.99 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reduce
        ? { duration: 0.01 }
        : { type: "spring", stiffness: 260, damping: 22, delay: Math.min(0.22, i * 0.03) },
    }),
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: { xs: 2, md: 3 },
        border: "2px dashed rgba(255,255,255,0.18)",
        backgroundColor: "rgba(0,0,0,0.20)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Stack spacing={0.5}>
            <Typography sx={{ opacity: 0.8 }}>Trade your tickets for prizes.</Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Chip
              label={`Earned: ${ticketsEarned}`}
              sx={{
                backgroundColor: "rgba(0,0,0,0.28)",
                border: "1px dashed rgba(255,255,255,0.22)",
                color: "rgba(255,255,255,0.92)",
              }}
            />
            <Chip
              label={`Available: ${ticketsAvailable}`}
              sx={{
                backgroundColor: "rgba(0,0,0,0.28)",
                border: "1px dashed rgba(250,204,21,0.35)",
                color: "rgba(255,255,255,0.92)",
              }}
            />
            <Chip
              label={`Claimed: ${claimedCount}/${prizes.length}`}
              sx={{
                backgroundColor: "rgba(0,0,0,0.28)",
                border: "1px dashed rgba(225,29,72,0.35)",
                color: "rgba(255,255,255,0.92)",
              }}
            />
          </Stack>
        </Stack>

        {/* Mode + actions */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Chip
              clickable
              onClick={() => setModeAndPersist("spend")}
              label={mode === "spend" ? "✅ Spend Mode" : "Spend Mode"}
              sx={{
                cursor: "pointer",
                backgroundColor: mode === "spend" ? "rgba(250,204,21,0.16)" : "rgba(0,0,0,0.22)",
                border: "1px dashed rgba(250,204,21,0.35)",
                color: "rgba(255,255,255,0.92)",
              }}
            />
            <Chip
              clickable
              onClick={() => setModeAndPersist("badge")}
              label={mode === "badge" ? "✅ Collector Mode" : "Collector Mode"}
              sx={{
                cursor: "pointer",
                backgroundColor: mode === "badge" ? "rgba(225,29,72,0.14)" : "rgba(0,0,0,0.22)",
                border: "1px dashed rgba(225,29,72,0.35)",
                color: "rgba(255,255,255,0.92)",
              }}
            />
            <Typography sx={{ opacity: 0.7, fontSize: 13 }}>
              {mode === "spend"
                ? "Spend Mode subtracts available tickets."
                : "Collector Mode requires tickets earned, but doesn’t subtract."}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: "wrap" }}>
            <Button
              type="button"
              onClick={goToMidway}
              disabled={!onBackToMidway}
              variant="outlined"
              sx={{
                borderRadius: 999,
                borderStyle: "dashed",
                borderColor: "rgba(250,204,21,0.45)",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              Back to Midway
            </Button>

            <Button
              type="button"
              onClick={leaveNow}
              disabled={!onLeave}
              variant="contained"
              sx={{
                borderRadius: 999,
                px: 2.2,
                backgroundImage:
                  "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
              }}
            >
              Leave
            </Button>

            <Button
              type="button"
              onClick={resetClaims}
              variant="outlined"
              sx={{
                borderRadius: 999,
                borderStyle: "dashed",
                borderColor: "rgba(255,255,255,0.35)",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Reset claimed
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.14)" }} />

        {/* Prize grid (tightened) */}
        <Grid container spacing={1.6} sx={{ alignItems: "stretch" }}>
          {prizes.map((p, i) => {
            const isClaimed = Boolean(claimed?.[p.id]);
            const disabled = !canClaim(p);
            const why = reasonDisabled(p);

            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <MotionBox
                  variants={cardVariant}
                  initial="hidden"
                  animate="show"
                  custom={i}
                  sx={{
                    borderRadius: 3,
                    p: 2,
                    border: "1px dashed rgba(255,255,255,0.18)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                    boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
                  }}
                >
                  <Stack spacing={1.1}>
                    {/* Top row */}
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                        <Typography fontWeight={950} sx={{ letterSpacing: 0.2, ...clamp2 }}>
                          {p.name}
                        </Typography>
                        <Typography sx={{ opacity: 0.82, fontSize: 13, ...clamp2 }}>
                          {p.blurb}
                        </Typography>
                      </Stack>

                      <Chip
                        label={`${p.cost} 🎟️`}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.26)",
                          border: "1px dashed rgba(250,204,21,0.35)",
                          color: "rgba(255,255,255,0.92)",
                          flexShrink: 0,
                        }}
                      />
                    </Stack>

                    <Typography sx={{ opacity: 0.7, fontSize: 13, ...clamp2 }}>
                      {p.flavor}
                    </Typography>

                    {/* Compact CTA block */}
                    <Stack spacing={1} sx={{ pt: 0.5 }}>
                      <Chip
                        label={
                          isClaimed
                            ? "✅ Claimed"
                            : disabled
                            ? `⛔ ${why}`
                            : "Ready to redeem"
                        }
                        sx={{
                          width: "fit-content",
                          maxWidth: "100%",
                          backgroundColor: isClaimed
                            ? "rgba(34,197,94,0.14)"
                            : disabled
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(250,204,21,0.12)",
                          border: `1px dashed ${
                            isClaimed
                              ? "rgba(34,197,94,0.35)"
                              : disabled
                              ? "rgba(255,255,255,0.18)"
                              : "rgba(250,204,21,0.35)"
                          }`,
                          color: "rgba(255,255,255,0.9)",
                        }}
                      />

                      <Button
                        onClick={() => openConfirm(p)}
                        disabled={isClaimed || disabled}
                        variant="contained"
                        sx={{
                          borderRadius: 999,
                          px: 2.2,
                          alignSelf: { xs: "stretch", sm: "flex-end" },
                          minWidth: { sm: 140 },
                          backgroundImage:
                            isClaimed || disabled
                              ? "none"
                              : "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
                        }}
                      >
                        {isClaimed ? "Redeemed" : "Redeem"}
                      </Button>
                    </Stack>
                  </Stack>
                </MotionBox>
              </Grid>
            );
          })}
        </Grid>

        {/* Confirm dialog */}
        <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 950 }}>Confirm redemption</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1}>
              <Typography sx={{ opacity: 0.9 }}>
                {pendingPrize ? (
                  <>
                    Claim <b>{pendingPrize.name}</b> for <b>{pendingPrize.cost} tickets</b>?
                  </>
                ) : (
                  "Pick a prize."
                )}
              </Typography>

              <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                {mode === "spend"
                  ? `This will reduce your available tickets. Available after: ${
                      pendingPrize ? Math.max(0, ticketsAvailable - pendingPrize.cost) : ticketsAvailable
                    }`
                  : "Collector Mode: you keep your tickets, but must have earned enough to claim."}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={closeConfirm}
              variant="outlined"
              sx={{ borderRadius: 999, borderStyle: "dashed" }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmClaim}
              disabled={!pendingPrize || !canClaim(pendingPrize)}
              variant="contained"
              sx={{
                borderRadius: 999,
                backgroundImage: "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}