"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// ✅ point back to your existing workshop code in /features
import modules from "@/features/workshop/modules";
import ModuleRenderer from "@/features/workshop/ModuleRenderer";
import { loadState, mergeSave, saveState } from "@/features/workshop/storage";
import { computeScore } from "@/features/workshop/computeScore";

export default function WorkshopClient() {
  const searchParams = useSearchParams();
  const isPresenter = searchParams?.get("mode") === "presenter";
  const startId = searchParams?.get("start"); // optional

  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState({});

  React.useEffect(() => {
    const saved = loadState();
    if (saved?.answers) setAnswers(saved.answers);
    if (saved?.idx != null) setIdx(saved.idx);

    // If a start module is specified, jump there (useful from Park)
    if (startId) {
      const startIndex = modules.findIndex((m) => m.id === startId);
      if (startIndex >= 0) setIdx(startIndex);
    }
  }, [startId]);

  React.useEffect(() => {
    mergeSave({ idx, answers });
  }, [idx, answers]);

  const score = React.useMemo(() => computeScore(answers), [answers]);
  const current = modules[idx];
  const progress = Math.round(((idx + 1) / modules.length) * 100);

  const onAnswered = (moduleId, payload) => {
    setAnswers((prev) => ({
      ...prev,
      [moduleId]: payload,
    }));
  };

  const reset = () => {
    setIdx(0);
    setAnswers({});
    saveState({ idx: 0, answers: {} });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card elevation={10}>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Guided Tour
                </Typography>
                <Typography sx={{ opacity: 0.8 }}>
                  {isPresenter ? "Presenter Mode" : "Participant Mode"} • Module{" "}
                  {idx + 1} of {modules.length}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`Misfit Score: ${score}`} />
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={reset}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>

            <LinearProgress variant="determinate" value={progress} />
            <Divider />

            <ModuleRenderer
              module={current}
              priorAnswer={answers[current.id]}
              onAnswered={onAnswered}
              isPresenter={isPresenter}
            />

            <Divider />

            <Stack direction="row" justifyContent="space-between">
              <Button
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                disabled={idx <= 0}
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
              >
                Back
              </Button>

              <Button
                endIcon={<ArrowForwardIcon />}
                variant="contained"
                disabled={idx >= modules.length - 1}
                onClick={() => setIdx((i) => Math.min(modules.length - 1, i + 1))}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}