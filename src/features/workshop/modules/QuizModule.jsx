"use client";

import * as React from "react";
import {
  Stack,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

export default function QuizModule({ module, priorAnswer, onAnswered }) {
  const [answers, setAnswers] = React.useState(priorAnswer?.answers || {});
  const [done, setDone] = React.useState(Boolean(priorAnswer));
  const [results, setResults] = React.useState(priorAnswer?.results || null);

  const choose = (qId, choiceId) => {
    if (done) return;
    setAnswers((prev) => ({ ...prev, [qId]: choiceId }));
  };

  const submit = () => {
    if (done) return;

    let points = 0;
    const nextResults = {};

    for (const item of module.items) {
      const picked = answers[item.id];
      const correct = picked === item.answerId;
      nextResults[item.id] = { picked, correct };
      if (correct) points += item.points || 1;
    }

    setResults(nextResults);
    setDone(true);
    onAnswered(module.id, { answers, results: nextResults, points });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={800}>
        {module.title}
      </Typography>

      <Stack spacing={2}>
        {module.items.map((item) => (
          <Card
            key={item.id}
            elevation={0}
            sx={{ border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <CardContent>
              <Typography fontWeight={700}>{item.question}</Typography>
              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1}>
                {item.choices.map((c) => (
                  <Button
                    key={c.id}
                    variant={answers[item.id] === c.id ? "contained" : "outlined"}
                    onClick={() => choose(item.id, c.id)}
                  >
                    {c.text}
                  </Button>
                ))}
              </Stack>

              {done && (
                <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                  <Typography fontWeight={800}>
                    {results?.[item.id]?.correct ? "Correct." : "Not quite."}
                  </Typography>
                  <Typography sx={{ opacity: 0.9 }}>{item.explain}</Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {!done ? (
        <Button variant="contained" onClick={submit}>
          Submit
        </Button>
      ) : (
        <Alert severity="success" variant="outlined">
          Locked in. This is how you stop being surprised by “confidently wrong.”
        </Alert>
      )}
    </Stack>
  );
}