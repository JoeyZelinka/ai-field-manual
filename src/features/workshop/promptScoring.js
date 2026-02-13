export function scorePrompt(p = "") {
  const t = String(p || "").toLowerCase();

  const checks = {
    role: /(you are|act as|role:)/.test(t),
    task: /(task:|write|generate|create|draft|produce)/.test(t),
    context: /(facts|context|inputs|given|may use)/.test(t),
    constraints: /(must|must not|do not|avoid|only|limit|constraints)/.test(t),
    format: /(output format|format|json|bullets|schema|headings)/.test(t),
    verification: /(qa|checklist|verify|validate|assumptions|unknown|questions)/.test(t),
    safety: /(personal data|pii|sensitive|refuse|allowlist|untrusted)/.test(t),
  };

  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}