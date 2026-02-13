"use client";

import PollModule from "./modules/PollModule";
import QuizModule from "./modules/QuizModule";
import PromptTriageModule from "./modules/PromptTriageModule";
import SecuritySimModule from "./modules/SecuritySimModule";
import InfoModule from "./modules/InfoModule";

export default function ModuleRenderer({ module, priorAnswer, onAnswered, isPresenter }) {
  switch (module.type) {
    case "poll":
      return <PollModule module={module} priorAnswer={priorAnswer} onAnswered={onAnswered} isPresenter={isPresenter} />;
    case "quiz":
      return <QuizModule module={module} priorAnswer={priorAnswer} onAnswered={onAnswered} />;
    case "promptTriage":
      return <PromptTriageModule module={module} priorAnswer={priorAnswer} onAnswered={onAnswered} />;
    case "securitySim":
      return <SecuritySimModule module={module} priorAnswer={priorAnswer} onAnswered={onAnswered} />;
    case "info":
    default:
      return <InfoModule module={module} priorAnswer={priorAnswer} onAnswered={onAnswered} />;
  }
}