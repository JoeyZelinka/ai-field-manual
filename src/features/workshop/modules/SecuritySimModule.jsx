"use client";

import * as React from "react";
import { Stack, Typography, Button, Alert, Card, CardContent, Divider } from "@mui/material";

export default function SecuritySimModule({ module, priorAnswer, onAnswered }) {
  const [picked, setPicked] = React.useState(priorAnswer?.choiceId || null);
  const [done, setDone] = React.useState(Boolean(priorAnswer));

  const submit = (choiceId) => {
    if (done) return;
    setPicked(choiceId);
    setDone(true);

    const opt = module.options.find((o) => o.id === choiceId);
    const points = opt?.isCorrect ? module.pointsCorrect : 0;

    onAnswered(module.id, {
      choiceId,
      isCorrect: Boolean(opt?.isCorrect),
      points,
    });
  };

  const pickedOpt = module.options.find((o) => o.id === picked);

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={800}>
        {module.title}
      </Typography>

      <Card elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Typography fontWeight={800}>Scenario</Typography>
          <Divider sx={{ my: 1.5 }} />
          <Typography sx={{ whiteSpace: "pre-wrap", opacity: 0.9 }}>
            {module.scenario}
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        {module.options.map((opt) => (
          <Button
            key={opt.id}
            variant={picked === opt.id ? "contained" : "outlined"}
            onClick={() => submit(opt.id)}
          >
            {opt.label}
          </Button>
        ))}
      </Stack>

      {done && pickedOpt && (
        <Alert severity={pickedOpt.isCorrect ? "success" : "error"} variant="outlined">
          <Typography fontWeight={900}>
            {pickedOpt.isCorrect ? "Correct." : "Nope."}
          </Typography>
          <Typography sx={{ opacity: 0.9 }}>{pickedOpt.why}</Typography>
        </Alert>
      )}
    </Stack>
  );
}