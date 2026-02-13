export function computeScore(answers = {}) {
  return Object.values(answers).reduce((sum, a) => {
    const pts = Number(a?.points ?? 0);
    return sum + (Number.isFinite(pts) ? pts : 0);
  }, 0);
}