"use client";

import * as React from "react";
import { Stack, Typography, Button, Alert, Card, CardContent } from "@mui/material";

export default function PollModule({ module, priorAnswer, onAnswered }) {
  const [selected, setSelected] = React.useState(priorAnswer?.choiceId || null);
  const [done, setDone] = React.useState(Boolean(priorAnswer));

  const submit = (choiceId) => {
    if (done) return;
    setSelected(choiceId);
    setDone(true);
    const pts = module.points?.[choiceId] ?? 0;
    onAnswered(module.id, { choiceId, points: pts });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={800}>
        {module.title}
      </Typography>
      <Typography sx={{ opacity: 0.9 }}>{module.prompt}</Typography>

      <Stack spacing={1}>
        {module.options.map((opt) => (
          <Button
            key={opt.id}
            variant={selected === opt.id ? "contained" : "outlined"}
            onClick={() => submit(opt.id)}
          >
            {opt.label}
          </Button>
        ))}
      </Stack>

      {done && module.reveal && (
        <Card elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <CardContent>
            <Alert severity="info" variant="outlined">
              <Typography fontWeight={800}>{module.reveal.headline}</Typography>
              <Typography sx={{ mt: 1, opacity: 0.9 }}>{module.reveal.body}</Typography>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}