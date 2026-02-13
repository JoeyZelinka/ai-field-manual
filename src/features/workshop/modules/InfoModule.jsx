"use client";

import * as React from "react";
import { Stack, Typography, Card, CardContent, Button, Alert, Divider } from "@mui/material";

export default function InfoModule({ module, priorAnswer, onAnswered }) {
  const [picked, setPicked] = React.useState(priorAnswer?.choiceId || null);

  const choose = (choiceId) => {
    setPicked(choiceId);
    onAnswered(module.id, { choiceId, points: 1 });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={800}>
        {module.title}
      </Typography>

      {module.bullets?.length ? (
        <Card elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <CardContent>
            <Stack spacing={1}>
              {module.bullets.map((b) => (
                <Typography key={b} sx={{ opacity: 0.9 }}>
                  • {b}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {module.prompt && module.options?.length ? (
        <Card elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <CardContent>
            <Typography fontWeight={800}>{module.prompt}</Typography>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1}>
              {module.options.map((o) => (
                <Button
                  key={o.id}
                  variant={picked === o.id ? "contained" : "outlined"}
                  onClick={() => choose(o.id)}
                >
                  {o.label}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info" variant="outlined">
          No interaction here — just principles worth stealing.
        </Alert>
      )}
    </Stack>
  );
}