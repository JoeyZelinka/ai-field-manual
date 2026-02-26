// src/features/carnival/modules.js

export const FRONT_GATE_ID = "front_gate_manifesto";

const modules = [
  // ===== FRONT GATE =====
  {
    id: FRONT_GATE_ID,
    type: "manifesto",
    title: "Front Gate Manifesto",
    park: {
      area: "Front Gate",
      attraction: "Manifesto",
      icon: "edit",
      blurb: "Before you hit the Midway: what we’re doing, why we’re doing it, and how we do it responsibly.",
      time: "2–3 min",
      level: "Starter",
    },
  },

  // ===== THE MIDWAY =====
  {
    id: "ai_gatekeeping_dunk_tank",
    type: "dunk_tank",
    title: "AI Gatekeeping",
    park: {
      area: "The Midway",
      attraction: "Dunk Tank",
      icon: "fire",
      blurb: "Dunk the purity testers. Tools are leverage. Outcomes are the point.",
      time: "2–3 min",
      level: "Starter",
    },
  },
  {
    id: "prompt_bow_toss",
    type: "bow_toss",
    title: "Prompts: Bad → Better → Great",
    park: {
      area: "The Midway",
      attraction: "Goldfish Bowl Toss",
      icon: "sparkle",
      blurb: "Upgrade prompts step-by-step and win the goldfish (aka reliable output).",
      time: "4–6 min",
      level: "Core Skill",
    },
  },
  {
    id: "email_shooting_gallery",
    type: "shooting_gallery",
    title: "Help Build an Email",
    park: {
      area: "The Midway",
      attraction: "Shooting Gallery",
      icon: "brain",
      blurb: "Drag pieces into place and assemble a clean, on-brand email.",
      time: "5–7 min",
      level: "Hands-on",
    },
  },
  {
    id: "secure_prompt_balloon_dart",
    type: "balloon_dart",
    title: "What’s Safe to Put in a Prompt?",
    park: {
      area: "The Midway",
      attraction: "Balloon Dart",
      icon: "shield",
      blurb: "Pop risky inputs. Keep secrets out. Learn the rules without the lecture.",
      time: "4–6 min",
      level: "Security",
    }
    },
    {
    id: "funhouse_prompt_engineering",
    type: "funhouse",
    title: "Mirror Maze of Truth (Prompt Engineering)",
    park: {
      area: "The Midway",
      attraction: "The Funhouse",
      icon: "brain",
      blurb: "Learn prompt guardrails that keep models honest and reduce hallucinations.",
      time: "8–10 min",
      level: "Intermediate",
    }
  },

  // ===== EXIT =====
  {
    id: "prize_counter",
    type: "prize_counter",
    title: "Prize Counter",
    park: {
      area: "Exit",
      attraction: "Trade Tickets for Prizes",
      icon: "gift",
      blurb: "Cash in your Prize Tickets. (We’ll wire real prizes later.)",
      time: "1–2 min",
      level: "Fun",
    },
  },
];

export default modules;

export function getArea(m) {
  return m?.park?.area || "Park";
}

export function requiresFrontGate(m) {
  return getArea(m) !== "Front Gate";
}