"use client";

import * as React from "react";
import Link from "next/link";
import {
  Container,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TourIcon from "@mui/icons-material/Tour";
import ParkIcon from "@mui/icons-material/Park";

import modules from "@/features/workshop/modules";
import ModuleRenderer from "@/features/workshop/ModuleRenderer";
import { loadState, mergeSave } from "@/features/workshop/storage";
import { computeScore } from "@/features/workshop/computeScore";

export default function Ride({ id }) {
  const module = modules.find((m) => m.id === id);

  const [answers, setAnswers] = React.useState({});

  React.useEffect(() => {
    const saved = loadState();
    if (saved?.answers) setAnswers(saved.answers);
  }, []);

  const score = React.useMemo(() => computeScore(answers), [answers]);
  const completed = Object.keys(answers).length;

  const onAnswered = (moduleId, payload) => {
    setAnswers((prev) => {
      const next = { ...prev, [moduleId]: payload };
      mergeSave({ answers: next });
      return next;
    });
  };

  if (!module) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Card elevation={10}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h4" fontWeight={900}>
                Ride not found
              </Typography>
              <Typography sx={{ opacity: 0.85 }}>
                That attraction doesn’t exist (yet). Back to the park map.
              </Typography>
              <Button component={Link} href="/" variant="contained" startIcon={<ParkIcon />}>
                Back to Park
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

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
              <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={900}>
                  {module.park?.attraction || "Attraction"}
                </Typography>
                <Typography sx={{ opacity: 0.8 }}>
                  {module.title}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`Completed: ${completed}/${modules.length}`} />
                <Chip label={`Score: ${score}`} />
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                component={Link}
                href="/"
                variant="outlined"
                startIcon={<ArrowBackIcon />}
              >
                Back to Park
              </Button>
              <Button
                component={Link}
                href={`/workshop?start=${module.id}`}
                variant="contained"
                startIcon={<TourIcon />}
              >
                Guided Tour from here
              </Button>
            </Stack>

            <Divider />

            <ModuleRenderer
              module={module}
              priorAnswer={answers[module.id]}
              onAnswered={onAnswered}
              isPresenter={false}
            />
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}