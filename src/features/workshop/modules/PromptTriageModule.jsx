"use client";

import * as React from "react";
import {
  Stack,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Alert,
  Divider,
  Box,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { scorePrompt } from "../promptScoring";

function copy(text) {
  navigator.clipboard?.writeText(text);
}

export default function PromptTriageModule({ module, priorAnswer, onAnswered }) {
  const [draft, setDraft] = React.useState(priorAnswer?.draft || module.badPrompt);
  const [done, setDone] = React.useState(Boolean(priorAnswer?.done));

  const { score, checks } = scorePrompt(draft);

  const submit = () => {
    if (done) return;
    setDone(true);
    // Points: reward structure, not perfection
    const points = Math.min(5, score);
    onAnswered(module.id, { draft, score, checks, done: true, points });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={800}>
        {module.title}
      </Typography>

      <Alert severity="warning" variant="outlined">
        Mission: take a mediocre prompt and turn it into a prompt that produces deploy-ready output — with rules.
      </Alert>

      <Card elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Typography fontWeight={800}>Case File (sanitized)</Typography>
          <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
            Use this as reference. Do not introduce new facts. Do not include personal fields.
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1}>
            <Typography><b>Language:</b> {module.casefile.language}</Typography>
            <Typography><b>Subject:</b> {module.casefile.subject}</Typography>
            <Typography><b>Preheader:</b> {module.casefile.preheader}</Typography>
            <Typography><b>Hero:</b> {module.casefile.hero}</Typography>
            <Typography><b>Expiry:</b> {module.casefile.expiry}</Typography>
            <Typography><b>Primary CTA:</b> {module.casefile.primaryCta}</Typography>
            <Typography><b>Benefits:</b> {module.casefile.benefits.join(" • ")}</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Typography fontWeight={800}>Starter prompt</Typography>
          <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
            Improve this prompt so the output is structured, safe, and reviewable.
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <TextField
            label="Your improved prompt"
            multiline
            minRows={10}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            fullWidth
          />

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
            <Chip label={`Prompt Score: ${score}/7`} />
            {Object.entries(checks).map(([k, v]) => (
              <Chip key={k} label={`${k}: ${v ? "✅" : "—"}`} variant="outlined" />
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight={800}>Target outcome</Typography>
          <Stack sx={{ mt: 1 }} spacing={0.5}>
            {module.targetOutcome.map((t) => (
              <Typography key={t} sx={{ opacity: 0.9 }}>
                • {t}
              </Typography>
            ))}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={submit} disabled={done}>
              {done ? "Submitted" : "Submit"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => copy(draft)}
            >
              Copy my prompt
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {(done || priorAnswer?.done) && (
        <Card elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography fontWeight={900}>Gold Prompt (reference)</Typography>
              <Typography sx={{ opacity: 0.85 }}>
                This is what “great” looks like: constraints + format + checks.
              </Typography>

              <Box
                component="pre"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 13,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.12)",
                  overflow: "auto",
                }}
              >
                {module.goldPrompt}
              </Box>

              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => copy(module.goldPrompt)}
              >
                Copy gold prompt
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}