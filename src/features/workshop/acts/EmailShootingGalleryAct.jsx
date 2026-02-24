"use client";

import * as React from "react";
import { Box, Stack, Typography, Button, Divider, Chip } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

const MotionBox = motion(Box);

const GALLERY = {
  title: "Shooting Gallery",
  intro:
    "Build a clean email by placing the right blocks in the right slots. Drag blocks into the template (or click a block, then click a slot).",
  artHint: "Drop shooting gallery art here later.",
  slots: [
    { id: "subject", label: "Subject", required: true },
    { id: "preheader", label: "Preheader", required: true },
    { id: "headline", label: "Headline", required: true },
    { id: "body", label: "Body", required: true },
    { id: "cta", label: "CTA", required: true },
    { id: "footer", label: "Footer/Legal", required: true },
  ],
  blocks: [
    // ✅ Good blocks
    { id: "b_subject_good", slot: "subject", label: "Feature X is live — faster workflows", quality: "good" },
    { id: "b_preheader_good", slot: "preheader", label: "See what’s new and how to try it today.", quality: "good" },
    { id: "b_headline_good", slot: "headline", label: "Meet Feature X", quality: "good" },
    { id: "b_body_good", slot: "body", label: "In 2–3 sentences: what it does + who it helps + why it matters.", quality: "good" },
    { id: "b_cta_good", slot: "cta", label: "Try Feature X", quality: "good" },
    { id: "b_footer_good", slot: "footer", label: "You’re receiving this because… Unsubscribe | Privacy", quality: "good" },

    // ❌ Decoys (teach via misses)
    { id: "b_subject_bad", slot: "subject", label: "RE: IMPORTANT UPDATE!!!", quality: "bad" },
    { id: "b_body_bad", slot: "body", label: "Wall of text with no structure, no benefit, no next step.", quality: "bad" },
    { id: "b_cta_bad", slot: "cta", label: "CLICK HERE NOW", quality: "bad" },
  ],
};

function findBlock(id) {
  return GALLERY.blocks.find((b) => b.id === id) || null;
}

function isComplete(layout) {
  return GALLERY.slots.every((s) => Boolean(layout?.[s.id]));
}

export default function EmailShootingGalleryAct({ value, onComplete }) {
  const reduce = useReducedMotion();

  const initialLayout = React.useMemo(() => {
    const v = value && typeof value === "object" ? value : null;
    return v?.layout && typeof v.layout === "object" ? v.layout : {};
  }, [value]);

  const [layout, setLayout] = React.useState(initialLayout);
  const [armedId, setArmedId] = React.useState(null);

  const complete = isComplete(layout);
  const isStamped = Boolean(value);

  const place = (blockId, slotId) => {
    const block = findBlock(blockId);
    if (!block) return;

    setLayout((prev) => ({ ...prev, [slotId]: blockId }));
    setArmedId(null);
  };

  const remove = (slotId) => {
    setLayout((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const handleDrop = (e, slotId) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData("text/plain");
    if (!blockId) return;
    place(blockId, slotId);
  };

  const stamp = () => {
    if (!complete) return;

    onComplete?.({
      type: "shooting_gallery",
      layout,
      completedAt: Date.now(),
    });
  };

  const used = new Set(Object.values(layout || {}));
  const tray = GALLERY.blocks.filter((b) => !used.has(b.id));

  return (
    <Stack spacing={2.5}>
      <Typography sx={{ opacity: 0.92 }}>{GALLERY.intro}</Typography>

      {/* ART SLOT */}
      <Box
        sx={{
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.18)",
          p: 2.5,
          textAlign: "center",
          opacity: 0.9,
        }}
      >
        <Typography fontWeight={950}>🎨 Shooting Gallery Art Slot</Typography>
        <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{GALLERY.artHint}</Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} alignItems="center">
        <Chip
          label={`Filled: ${Object.keys(layout).length}/${GALLERY.slots.length}`}
          sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(255,255,255,0.18)" }}
        />
        {armedId ? (
          <Chip
            label={`Armed: ${armedId}`}
            sx={{ backgroundColor: "rgba(0,0,0,0.28)", border: "1px dashed rgba(56,189,248,0.35)" }}
          />
        ) : null}
      </Stack>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

      {/* TEMPLATE */}
      <Box
        sx={{
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.22)",
          backgroundColor: "rgba(0,0,0,0.18)",
          p: 2,
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 1 }}>
          Email Template
        </Typography>

        <Stack spacing={1.25}>
          {GALLERY.slots.map((slot) => {
            const blockId = layout?.[slot.id];
            const block = blockId ? findBlock(blockId) : null;

            return (
              <Slot
                key={slot.id}
                label={slot.label}
                filled={Boolean(block)}
                quality={block?.quality}
                onDrop={(e) => handleDrop(e, slot.id)}
                onClick={() => armedId && place(armedId, slot.id)}
                reduce={reduce}
              >
                {block ? (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography sx={{ opacity: 0.92, fontSize: 13 }}>{block.label}</Typography>
                    <Button size="small" variant="text" sx={{ opacity: 0.8 }} onClick={() => remove(slot.id)}>
                      Remove
                    </Button>
                  </Stack>
                ) : (
                  <Typography sx={{ opacity: 0.65, fontSize: 12 }}>
                    Drop a block here (or arm a block and click this slot).
                  </Typography>
                )}
              </Slot>
            );
          })}
        </Stack>
      </Box>

      {/* TRAY */}
      <Box
        sx={{
          borderRadius: 3,
          border: "2px dashed rgba(255,255,255,0.18)",
          backgroundColor: "rgba(0,0,0,0.16)",
          p: 2,
        }}
      >
        <Typography fontWeight={950} sx={{ mb: 1 }}>
          Block Tray
        </Typography>

        <Stack spacing={1}>
          {tray.map((b) => (
            <Block
              key={b.id}
              id={b.id}
              quality={b.quality}
              label={`${slotLabel(b.slot)}: ${b.label}`}
              armed={armedId === b.id}
              onArm={() => setArmedId(armedId === b.id ? null : b.id)}
            />
          ))}
        </Stack>
      </Box>

      {complete ? (
        <Box
          sx={{
            p: 2.25,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.22)",
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        >
          <Typography fontWeight={950} sx={{ mb: 1 }}>
            Why this wins
          </Typography>
          <Typography sx={{ opacity: 0.88 }}>
            Great email structure is: **clear promise (Subject/Headline)** → **context/value (Body)** → **one action (CTA)**.
            The “game” here is building muscle memory for clean composition.
          </Typography>
        </Box>
      ) : null}

      <Button
        onClick={stamp}
        disabled={!complete}
        variant="contained"
        sx={{
          borderRadius: 999,
          px: 3,
          alignSelf: "center",
          minWidth: 260,
          backgroundImage: "linear-gradient(90deg, rgba(225,29,72,0.95), rgba(250,204,21,0.95))",
          opacity: complete ? 1 : 0.55,
        }}
      >
        {isStamped ? "Re-stamp (no extra tickets)" : "Ring Bell & Stamp Ticket"}
      </Button>
    </Stack>
  );
}

function slotLabel(id) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function Slot({ label, filled, quality, onDrop, onClick, reduce, children }) {
  const border =
    !filled ? "rgba(255,255,255,0.18)" : quality === "good" ? "rgba(250,204,21,0.55)" : "rgba(225,29,72,0.55)";

  return (
    <MotionBox
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      whileHover={reduce ? {} : { y: -1 }}
      transition={{ duration: 0.12 }}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: `1px dashed ${border}`,
        backgroundColor: "rgba(0,0,0,0.14)",
        cursor: "pointer",
      }}
    >
      <Typography fontWeight={950} sx={{ mb: 0.5, fontSize: 12, opacity: 0.85 }}>
        {label}
      </Typography>
      {children}
    </MotionBox>
  );
}

function Block({ id, label, quality, armed, onArm }) {
  const border =
    armed ? "rgba(56,189,248,0.55)" : quality === "good" ? "rgba(250,204,21,0.35)" : "rgba(225,29,72,0.45)";

  return (
    <Box
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", id)}
      onClick={onArm}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: `1px dashed ${border}`,
        backgroundColor: "rgba(0,0,0,0.14)",
        userSelect: "none",
      }}
    >
      <Typography sx={{ opacity: 0.9, fontSize: 13 }}>{label}</Typography>
    </Box>
  );
}