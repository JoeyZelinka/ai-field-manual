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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const TARGET_IMG_SRC = "/target.png";
const BULLET_IMG_SRC = "/bullet.png";

const ROWS = 3;
const COLS = 4;
const TOTAL_TARGETS = ROWS * COLS;

// Keep the gallery compact so drag/drop doesn't require page scroll
const PROMPT_PANEL_MAX_H = 220; // internal scroll if content grows
const DRAFT_PANEL_MAX_H = 220;
const TARGET_CELL_MIN = { xs: 74, sm: 88, md: 104 }; // tighter targets

// --- Seed: Ambassador renewal (EN) ---
const AMBASSADOR_SEED = {
  audience: "Marriott Bonvoy member who renewed Ambassador Elite status",
  subject: "[Fname], you’ve renewed your Ambassador Elite status",
  preheader: "Continue to enjoy your Elite benefits.",
  hero: "Congratulations, [Fname]! You’ve renewed your Ambassador Elite status.",
  expiry: "February 28, 2027",
  benefits: [
    "Ambassador Service",
    "Enhanced Room Upgrades",
    "Your24™ flexibility",
  ],
  primaryCta: "Explore Benefits",
  secondary: {
    prefsHeadline:
      "Personalize your travel preferences so your personal Ambassador can learn more about you and your travel style.",
    prefsCta: "Update Your Preferences",
  },
  module: {
    headline: "One-to-One Connection",
    blurb:
      "Leave it all to your personal Ambassador. Enjoy exceptional travel near and far with tailor-made touches everywhere you go.",
    cta: "Learn More",
  },
};

// Player order (easy + matches email structure)
const PART_ORDER = [
  "subject",
  "preheader",
  "hero",
  "primaryCta",
  "secondary",
  "module",
];

const PART_LABEL = {
  subject: "Subject",
  preheader: "Preheader",
  hero: "Hero",
  primaryCta: "Primary CTA",
  secondary: "Secondary",
  module: "Module",
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

function chipStyleForPart() {
  return {
    backgroundColor: "rgba(0,0,0,0.40)",
    border: "1px dashed rgba(255,255,255,0.22)",
    color: "rgba(255,255,255,0.92)",
    height: 22,
  };
}

// ✅ Correct targets are PROMPT SNIPPETS that generate each part.
// The combination produces a complete prompt that compiles the Ambassador email.
const GOOD_SEQUENCE = [
  {
    part: "subject",
    title: "Subject",
    text:
      "You are a senior Marriott Bonvoy CRM email copywriter.\n" +
      "Task: Write the SUBJECT line for an Ambassador Elite renewal email.\n" +
      "Use premium, member-first tone. No hype. No emojis.\n" +
      "Personalization token must be [Fname].\n" +
      "Constraint: ≤ 60 characters.\n" +
      "Output: Return ONLY the subject line text.",
  },
  {
    part: "preheader",
    title: "Preheader",
    text:
      "You are a senior Marriott Bonvoy CRM email copywriter.\n" +
      "Task: Write the PREHEADER for an Ambassador Elite renewal email.\n" +
      "Reinforce continued Elite benefits, premium tone, no invented offers.\n" +
      "Constraint: ≤ 90 characters.\n" +
      "Output: Return ONLY the preheader text.",
  },
  {
    part: "hero",
    title: "Hero",
    text:
      "You are a senior Marriott Bonvoy CRM email copywriter.\n" +
      "Task: Write the HERO headline for an Ambassador Elite renewal email.\n" +
      "Keep it short, warm, premium. Use [Fname].\n" +
      "No exclamation spam. No urgency language.\n" +
      "Output: Return ONLY the hero headline.",
  },
  {
    part: "primaryCta",
    title: "Primary CTA",
    text:
      "You are a senior Marriott Bonvoy CRM email copywriter.\n" +
      "Task: Provide the PRIMARY CTA button text for an Ambassador Elite renewal email.\n" +
      "2–4 words, premium tone, no urgency.\n" +
      "Output: Return ONLY the CTA text.",
  },
  {
    part: "secondary",
    title: "Secondary",
    text:
      "You are a senior Marriott Bonvoy CRM email copywriter.\n" +
      "Task: Write the Preferences SECONDARY module.\n" +
      "Goal: Encourage the member to update travel preferences so their personal Ambassador can personalize stays.\n" +
      "Do NOT request sensitive info (no account numbers, addresses, phone, passport).\n" +
      "Output format (JSON only):\n" +
      '{ "prefs": { "headline": string, "body": string, "cta": string } }',
  },
  {
    part: "module",
    title: "Module",
    text:
      "You are a senior Marriott Bonvoy CRM email copywriter.\n" +
      "Task: Assemble a complete Ambassador Elite renewal email from the components.\n" +
      "Use ONLY the facts below. Do not invent benefits, dates, offers, requirements, or status terms.\n\n" +
      "FACTS:\n" +
      `- Audience: ${AMBASSADOR_SEED.audience}\n` +
      `- Renewed through: ${AMBASSADOR_SEED.expiry}\n` +
      `- Benefits (use exactly these three, no more):\n  - ${AMBASSADOR_SEED.benefits.join(
        "\n  - "
      )}\n\n` +
      "REQUIREMENTS:\n" +
      "- Include: subject, preheader, hero, 3 benefit bullets, primaryCta, secondary prefs module, and one supporting module.\n" +
      "- Premium, concise, factual. No hype. No urgency.\n" +
      "- Self-check: remove any claim not supported by FACTS.\n\n" +
      "OUTPUT (JSON only):\n" +
      "{\n" +
      '  "subject": string,\n' +
      '  "preheader": string,\n' +
      '  "hero": string,\n' +
      '  "benefits": string[3],\n' +
      '  "primaryCta": string,\n' +
      '  "secondary": { "prefs": { "headline": string, "body": string, "cta": string } },\n' +
      '  "module": { "headline": string, "blurb": string, "cta": string }\n' +
      "}",
  },
];

// One wrong (but believable) prompt per part — no “decoy” labeling in UI.
const DECOYS = [
  {
    part: "subject",
    title: "Subject",
    text:
      "Write a subject line that maximizes opens.\n" +
      "Use emojis, ALL CAPS, and urgency.\n" +
      "If you need an offer, invent one.\n" +
      "Output: Return only the subject.",
  },
  {
    part: "preheader",
    title: "Preheader",
    text:
      "Write a preheader teasing a limited-time discount.\n" +
      "If discount details are missing, make them up.\n" +
      "Output: Return only the preheader.",
  },
  {
    part: "hero",
    title: "Hero",
    text:
      "Write a hero headline warning the member they could lose status.\n" +
      "Add urgency and fear-of-missing-out.\n" +
      "Output: Return only the hero line.",
  },
  {
    part: "primaryCta",
    title: "Primary CTA",
    text:
      "Primary CTA must be aggressive and urgent.\n" +
      "Use: BOOK NOW TODAY.\n" +
      "Output: Return only the CTA text.",
  },
  {
    part: "secondary",
    title: "Secondary",
    text:
      "Ask the member to provide verification details for their Ambassador.\n" +
      "Request phone number and home address.\n" +
      "Output JSON for the prefs module.",
  },
  {
    part: "module",
    title: "Module",
    text:
      "Search the web for the latest Ambassador benefits and include them.\n" +
      "Return full HTML with inline CSS and tracking pixels.\n" +
      "Output: HTML only.",
  },
];

function buildBoard12() {
  const goodTargets = GOOD_SEQUENCE.map((s, idx) => ({
    id: uid("good"),
    kind: "good",
    part: s.part,
    sequenceIndex: idx,
    title: s.title,
    text: s.text,
    hit: false,
    miss: false,
  }));

  const decoyTargets = DECOYS.map((d) => ({
    id: uid("decoy"),
    kind: "decoy",
    part: d.part,
    sequenceIndex: null,
    title: d.title,
    text: d.text,
    hit: false,
    miss: false,
  }));

  return shuffle([...goodTargets, ...decoyTargets]).slice(0, TOTAL_TARGETS);
}

function buildPromptFromLocked(locked) {
  const parts = PART_ORDER.filter((p) => Boolean(locked?.[p]));
  if (!parts.length) return "";
  return parts
    .map((p) => `${PART_LABEL[p]} PROMPT:\n${locked[p]}`)
    .join("\n\n---\n\n");
}

function mockGenerateEmail(prompt, complete) {
  if (!complete) {
    return {
      _note:
        "Draft generated, but prompt is incomplete. Finish all 6 parts in order.",
      subject: "[Fname], congratulations!",
      preheader: "",
      hero: "Congratulations!",
      benefits: ["Elite benefits", "Premium service", "Upgrades"],
      primaryCta: "Learn More",
      secondary: {
        prefs: {
          headline: "Update preferences",
          body: "Tell us what you like.",
          cta: "Update",
        },
      },
      module: {
        headline: "Your benefits",
        blurb: "Explore what you’ve earned.",
        cta: "Explore",
      },
    };
  }

  return {
    subject: AMBASSADOR_SEED.subject,
    preheader: AMBASSADOR_SEED.preheader,
    hero: AMBASSADOR_SEED.hero,
    benefits: AMBASSADOR_SEED.benefits,
    primaryCta: AMBASSADOR_SEED.primaryCta,
    secondary: {
      prefs: {
        headline: AMBASSADOR_SEED.secondary.prefsHeadline,
        body: "Update a few details so your personal Ambassador can tailor your stays to your style.",
        cta: AMBASSADOR_SEED.secondary.prefsCta,
      },
    },
    module: AMBASSADOR_SEED.module,
  };
}

function EmailPreview({ email }) {
  if (!email) return null;

  const subject = email.subject ?? "";
  const preheader = email.preheader ?? "";
  const hero = email.hero ?? "";
  const benefits = Array.isArray(email.benefits) ? email.benefits : [];
  const primaryCta = email.primaryCta ?? "";
  const prefsHeadline = email.secondary?.prefs?.headline ?? "";
  const prefsBody = email.secondary?.prefs?.body ?? "";
  const prefsCta = email.secondary?.prefs?.cta ?? "";
  const moduleHeadline = email.module?.headline ?? "";
  const moduleBlurb = email.module?.blurb ?? "";
  const moduleCta = email.module?.cta ?? "";

  return (
    <Paper
      sx={{
        mt: 2,
        p: 1.6,
        borderRadius: 2,
        border: "1px dashed rgba(255,255,255,0.22)",
        backgroundColor: "rgba(0,0,0,0.18)",
      }}
    >
      <Typography fontWeight={950} sx={{ mb: 1 }}>
        Ambassador Email Preview
      </Typography>

      {/* Subject + Preheader */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.25,
          borderRadius: 2,
          borderStyle: "dashed",
          borderColor: "rgba(250,204,21,0.35)",
          backgroundColor: "rgba(0,0,0,0.14)",
          mb: 1.2,
        }}
      >
        <Typography sx={{ fontSize: 12, opacity: 0.75 }}>Subject</Typography>
        <Typography sx={{ fontWeight: 900, mb: 0.8, whiteSpace: "pre-wrap" }}>
          {subject}
        </Typography>

        <Typography sx={{ fontSize: 12, opacity: 0.75 }}>Preheader</Typography>
        <Typography sx={{ opacity: 0.92, whiteSpace: "pre-wrap" }}>
          {preheader}
        </Typography>
      </Paper>

      {/* Hero */}
      <Paper
        sx={{
          p: 1.6,
          borderRadius: 2,
          border: "1px dashed rgba(255,255,255,0.18)",
          background:
            "radial-gradient(800px 280px at 30% 0%, rgba(250,204,21,0.16), transparent 60%)",
          mb: 1.2,
        }}
      >
        <Typography
          sx={{
            fontWeight: 950,
            fontSize: 18,
            lineHeight: 1.25,
            whiteSpace: "pre-wrap",
          }}
        >
          {hero}
        </Typography>
      </Paper>

      {/* Benefits */}
      {benefits.length ? (
        <Box sx={{ mb: 1.2 }}>
          <Typography sx={{ fontSize: 12, opacity: 0.75, mb: 0.6 }}>
            Benefits
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.2, opacity: 0.92 }}>
            {benefits.slice(0, 3).map((b, i) => (
              <li key={i}>
                <Typography sx={{ lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {b}
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      ) : null}

      {/* Primary CTA */}
      {primaryCta ? (
        <Button
          variant="contained"
          disabled
          sx={{
            borderRadius: 999,
            px: 3,
            backgroundImage:
              "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
            mb: 1.2,
          }}
        >
          {primaryCta}
        </Button>
      ) : null}

      {/* Secondary module */}
      {(prefsHeadline || prefsBody || prefsCta) && (
        <Paper
          sx={{
            p: 1.25,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.18)",
            backgroundColor: "rgba(0,0,0,0.14)",
            mb: 1.2,
          }}
        >
          {prefsHeadline ? (
            <Typography sx={{ fontWeight: 900, mb: 0.5, whiteSpace: "pre-wrap" }}>
              {prefsHeadline}
            </Typography>
          ) : null}

          {prefsBody ? (
            <Typography sx={{ opacity: 0.9, mb: 0.9, whiteSpace: "pre-wrap" }}>
              {prefsBody}
            </Typography>
          ) : null}

          {prefsCta ? (
            <Button
              variant="outlined"
              disabled
              sx={{ borderRadius: 999, borderStyle: "dashed" }}
            >
              {prefsCta}
            </Button>
          ) : null}
        </Paper>
      )}

      {/* Supporting module */}
      {(moduleHeadline || moduleBlurb || moduleCta) && (
        <Paper
          sx={{
            p: 1.25,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.18)",
            backgroundColor: "rgba(0,0,0,0.14)",
          }}
        >
          {moduleHeadline ? (
            <Typography sx={{ fontWeight: 900, mb: 0.5, whiteSpace: "pre-wrap" }}>
              {moduleHeadline}
            </Typography>
          ) : null}

          {moduleBlurb ? (
            <Typography sx={{ opacity: 0.9, mb: 0.9, whiteSpace: "pre-wrap" }}>
              {moduleBlurb}
            </Typography>
          ) : null}

          {moduleCta ? (
            <Button
              variant="outlined"
              disabled
              sx={{ borderRadius: 999, borderStyle: "dashed" }}
            >
              {moduleCta}
            </Button>
          ) : null}
        </Paper>
      )}
    </Paper>
  );
}

export default function EmailShootingGalleryAct({ module, answer, onComplete }) {
  const reduce = useReducedMotion();

  const [board, setBoard] = React.useState([]);

  React.useEffect(() => {
    setBoard(buildBoard12());
  }, []);

  const [locked, setLocked] = React.useState({}); // ✅ drives progress + completion
  const [armed, setArmed] = React.useState(false);
  const [hits, setHits] = React.useState(0);
  const [misses, setMisses] = React.useState(0);

  const [feedback, setFeedback] = React.useState(null);
  const [wrongPulse, setWrongPulse] = React.useState(0);
  const [victoryOpen, setVictoryOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(null);

  const progress = React.useMemo(() => {
    return PART_ORDER.reduce((n, p) => (locked?.[p] ? n + 1 : n), 0);
  }, [locked]);

  const requiredTotal = PART_ORDER.length;
  const complete = React.useMemo(() => {
    return PART_ORDER.every((p) => Boolean(locked?.[p]));
  }, [locked]);

  const nextIdx = progress;
  const nextPart = PART_ORDER[nextIdx] ?? null;

  const prompt = React.useMemo(() => buildPromptFromLocked(locked), [locked]);

  function reset() {
    setBoard(buildBoard12());
    setLocked({});
    setArmed(false);
    setHits(0);
    setMisses(0);
    setFeedback(null);
    setWrongPulse(0);
    setVictoryOpen(false);
    setDraft(null);
  }

  function fireAI() {
    const out = mockGenerateEmail(prompt, complete);
    setDraft(out);

    if (complete) {
      setFeedback(null);
      setVictoryOpen(true);
    } else {
      setFeedback({
        type: "info",
        text: "Draft generated — but your prompt isn’t complete yet. Keep hitting the correct targets in order.",
      });
    }
  }

  const emailToShow = React.useMemo(() => {
    if (draft && typeof draft === "object" && draft.subject) return draft;

    if (complete) {
      return {
        subject: AMBASSADOR_SEED.subject,
        preheader: AMBASSADOR_SEED.preheader,
        hero: AMBASSADOR_SEED.hero,
        benefits: AMBASSADOR_SEED.benefits,
        primaryCta: AMBASSADOR_SEED.primaryCta,
        secondary: {
          prefs: {
            headline: AMBASSADOR_SEED.secondary.prefsHeadline,
            body: "Update a few details so your personal Ambassador can tailor your stays to your style.",
            cta: AMBASSADOR_SEED.secondary.prefsCta,
          },
        },
        module: AMBASSADOR_SEED.module,
      };
    }

    return null;
  }, [draft, complete]);

  function finishStamp() {
    const payload = {
      type: "shooting_gallery_targets_v3",
      completed: complete,
      hits,
      misses,
      progress,
      lockedParts: PART_ORDER.reduce((acc, p) => {
        acc[p] = Boolean(locked?.[p]);
        return acc;
      }, {}),
      prompt,
      draft,
      email: emailToShow,
      completedAt: Date.now(),
    };

    try {
      onComplete?.(payload);
      setFeedback({ type: "success", text: "✅ Ticket stamped." });
      setVictoryOpen(false);
    } catch (e) {
      console.error(e);
      setFeedback({
        type: "error",
        text: "Stamp failed — your onComplete handler threw an error. Check console.",
      });
    }
  }

  function onDragStartBullet(e) {
    e.dataTransfer.setData("text/plain", "bullet");
    e.dataTransfer.effectAllowed = "copy";
  }

  function tryHitTarget(targetId) {
    const needsPart = PART_ORDER[progress];

    const target = board.find((x) => x.id === targetId);
    if (!target) return;
    if (target.hit) return;
    if (!needsPart) return;

    const isCorrect =
      target.kind === "good" &&
      target.part === needsPart &&
      target.sequenceIndex === progress;

    if (isCorrect) {
      // lock part (drives progress/complete)
      setLocked((prev) => ({ ...prev, [target.part]: target.text }));
      setHits((h) => h + 1);
      setFeedback({ type: "success", text: `🎯 Locked: ${PART_LABEL[target.part]}` });

      // update board visuals (pure)
      setBoard((prev) =>
        prev.map((x) =>
          x.id === targetId ? { ...x, hit: true, miss: false } : x
        )
      );

      return;
    }

    setMisses((m) => m + 1);
    setWrongPulse((n) => n + 1);

    const reason =
      target.part !== needsPart
        ? `Wrong order. Next: ${PART_LABEL[needsPart]}.`
        : "Wrong snippet.";

    setFeedback({ type: "warning", text: `💥 CLUNK. ${reason}` });

    setBoard((prev) =>
      prev.map((x) => (x.id === targetId ? { ...x, miss: true } : x))
    );
  }

  function onDropTarget(e, targetId) {
    e.preventDefault();
    const payload = e.dataTransfer.getData("text/plain");
    if (payload !== "bullet") return;
    tryHitTarget(targetId);
  }

  function onClickTarget(targetId) {
    if (!armed) return;
    tryHitTarget(targetId);
    setArmed(false);
  }

  return (
    <Stack spacing={1.6} sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Victory Overlay */}
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
              transition={
                reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 18 }
              }
              sx={{
                width: "100%",
                maxWidth: 720,
                borderRadius: 3,
                border: "2px dashed rgba(255,255,255,0.22)",
                boxShadow: "0 22px 70px rgba(0,0,0,0.65)",
                backgroundColor: "rgba(18,10,12,0.94)",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2.2,
                  borderBottom: "1px dashed rgba(255,255,255,0.16)",
                  flex: "0 0 auto",
                }}
              >
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

              <Box sx={{ p: 2.5, overflowY: "auto", flex: "1 1 auto" }}>
                <Typography variant="h5" fontWeight={950} sx={{ mb: 0.75 }}>
                  Email Compiled
                </Typography>

                <Typography sx={{ opacity: 0.9, lineHeight: 1.55 }}>
                  You assembled the prompt in the correct order and generated the Ambassador email.
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
                    <Chip
                      label={`Steps: ${requiredTotal}/${requiredTotal}`}
                      sx={{ backgroundColor: "rgba(0,0,0,0.20)" }}
                    />
                  </Stack>
                </Paper>

                <EmailPreview email={emailToShow} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2.2 }}>
                  <Button
                    type="button"
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
                    type="button"
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
      <Stack spacing={0.3}>
        <Typography variant="h4">{module?.title ?? "Help Build an Email"}</Typography>
        <Typography sx={{ opacity: 0.85 }}>
          Hit the correct prompt snippets <b>in order</b>: Subject → Preheader → Hero → Primary CTA → Secondary → Module.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} alignItems="center">
          <Chip
            label={`Progress: ${progress}/${requiredTotal}`}
            sx={{
              backgroundColor: "rgba(0,0,0,0.28)",
              border: "1px dashed rgba(255,255,255,0.22)",
            }}
          />
          <Chip
            label={`Hits: ${hits}`}
            sx={{
              backgroundColor: "rgba(0,0,0,0.28)",
              border: "1px dashed rgba(255,255,255,0.22)",
            }}
          />
          <Chip
            label={`Misses: ${misses}`}
            sx={{
              backgroundColor: "rgba(0,0,0,0.28)",
              border: "1px dashed rgba(255,255,255,0.22)",
            }}
          />
          <Chip
            label={complete ? "Complete" : `Next: ${nextPart ? PART_LABEL[nextPart] : "—"}`}
            sx={{
              backgroundColor: "rgba(0,0,0,0.28)",
              border: "1px dashed rgba(250,204,21,0.35)",
            }}
          />

          <Button
            type="button"
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

          <Button
            type="button"
            variant="contained"
            onClick={fireAI}
            disabled={!prompt}
            sx={{
              borderRadius: 999,
              px: 2.2,
              backgroundImage:
                "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
            }}
          >
            FIRE
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

      {/* Compact Prompt + Draft */}
      <Paper
        sx={{
          p: 1.2,
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.18)",
        }}
      >
        <Accordion
          disableGutters
          defaultExpanded={false}
          sx={{
            backgroundColor: "transparent",
            color: "inherit",
            boxShadow: "none",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.75)" }} />}
          >
            <Typography fontWeight={950}>Assembled Prompt</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper
              variant="outlined"
              sx={{
                p: 1.2,
                borderRadius: 2,
                borderStyle: "dashed",
                borderColor: "rgba(250,204,21,0.35)",
                backgroundColor: "rgba(0,0,0,0.16)",
                maxHeight: PROMPT_PANEL_MAX_H,
                overflowY: "auto",
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
                {prompt || "No hits yet. Shoot the correct prompt snippets to assemble the prompt…"}
              </Typography>
            </Paper>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.08)" }} />

        <Accordion
          disableGutters
          defaultExpanded={false}
          sx={{
            backgroundColor: "transparent",
            color: "inherit",
            boxShadow: "none",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.75)" }} />}
          >
            <Typography fontWeight={950}>AI Draft (mock)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper
              sx={{
                p: 1.2,
                borderRadius: 2,
                border: "1px dashed rgba(255,255,255,0.22)",
                backgroundColor: "rgba(0,0,0,0.14)",
                maxHeight: DRAFT_PANEL_MAX_H,
                overflowY: "auto",
              }}
            >
              <Typography sx={{ whiteSpace: "pre-wrap", opacity: 0.92, fontSize: 13 }}>
                {draft ? JSON.stringify(draft, null, 2) : "Hit FIRE to generate a draft."}
              </Typography>
            </Paper>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Target Wall */}
      <Paper
        sx={{
          width: "100%",
          p: 1.2,
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.18)",
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 0.8 }}>
          Target Wall (3 × 4)
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, minmax(${TARGET_CELL_MIN.xs}px, 1fr))`,
            gap: { xs: 1, sm: 1.2 },
            "@media (min-width:600px)": {
              gridTemplateColumns: `repeat(${COLS}, minmax(${TARGET_CELL_MIN.sm}px, 1fr))`,
            },
            "@media (min-width:900px)": {
              gridTemplateColumns: `repeat(${COLS}, minmax(${TARGET_CELL_MIN.md}px, 1fr))`,
            },
          }}
        >
          {board.map((t) => {
            const missGlow = t.miss
              ? "0 0 0 5px rgba(225,29,72,0.14), 0 12px 28px rgba(0,0,0,0.28)"
              : "0 12px 28px rgba(0,0,0,0.28)";

            const needsPart = PART_ORDER[progress];
            const isNextPart = needsPart && t.part === needsPart;

            return (
              <Tooltip
                key={t.id}
                title={
                  <Box sx={{ p: 0.6, maxWidth: 520 }}>
                    <Typography
                      sx={{
                        fontWeight: 950,
                        fontSize: 12,
                        mb: 0.5,
                        opacity: 0.95,
                      }}
                    >
                      {PART_LABEL[t.part]} prompt snippet
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        opacity: 0.92,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {t.text}
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
                enterDelay={120}
              >
                <MotionBox
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropTarget(e, t.id)}
                  onClick={() => onClickTarget(t.id)}
                  animate={
                    !reduce && t.miss
                      ? {
                          rotate: [0, -2.2, 2.2, -1.5, 1.5, 0],
                          x: [0, -6, 6, -4, 4, 0],
                        }
                      : { rotate: 0, x: 0 }
                  }
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "crosshair",
                    border: t.hit
                      ? "2px dashed rgba(34,197,94,0.70)"
                      : t.miss
                      ? "2px dashed rgba(225,29,72,0.70)"
                      : isNextPart
                      ? "2px dashed rgba(250,204,21,0.45)"
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

                  {/* part chip */}
                  <Box sx={{ position: "absolute", left: 6, top: 6 }}>
                    <Chip size="small" label={PART_LABEL[t.part]} sx={chipStyleForPart()} />
                  </Box>

                  {/* HIT/MISS */}
                  <Box
                    sx={{
                      position: "absolute",
                      right: 6,
                      top: 6,
                      display: "flex",
                      gap: 0.6,
                    }}
                  >
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
                </MotionBox>
              </Tooltip>
            );
          })}
        </Box>

        <Typography sx={{ mt: 1, fontSize: 12, opacity: 0.7 }}>
          Hover a target to read its prompt snippet. Hit the correct snippet for the <b>next</b> email part.
        </Typography>
      </Paper>

      {/* Sticky Bullet Bar */}
      <Paper
        sx={{
          position: "sticky",
          bottom: 10,
          zIndex: 20,
          p: 1.1,
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.30)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Box
              draggable
              onDragStart={onDragStartBullet}
              onClick={() => setArmed((a) => !a)}
              sx={{
                width: 96,
                height: 52,
                borderRadius: 2,
                position: "relative",
                cursor: "grab",
                userSelect: "none",
                border: armed
                  ? "2px dashed rgba(250,204,21,0.75)"
                  : "2px dashed rgba(255,255,255,0.22)",
                backgroundColor: "rgba(0,0,0,0.20)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                "&:active": { cursor: "grabbing" },
              }}
            >
              <Image
                src={BULLET_IMG_SRC}
                alt="Bullet"
                fill
                sizes="96px"
                style={{ objectFit: "contain" }}
              />
            </Box>

            <Box>
              <Typography fontWeight={950} sx={{ opacity: 0.95 }}>
                Bullet
              </Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
                Drag onto a target. (Mobile: tap bullet to arm, then tap a target.)
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Chip
              label={complete ? "All parts locked" : `Next: ${nextPart ? PART_LABEL[nextPart] : "—"}`}
              sx={{
                backgroundColor: "rgba(0,0,0,0.28)",
                border: "1px dashed rgba(250,204,21,0.35)",
              }}
            />
            {armed ? (
              <Chip
                label="Armed"
                sx={{
                  backgroundColor: "rgba(250,204,21,0.10)",
                  border: "1px dashed rgba(250,204,21,0.45)",
                }}
              />
            ) : null}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}