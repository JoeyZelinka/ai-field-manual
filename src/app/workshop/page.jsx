import * as React from "react";
import { Suspense } from "react";
import WorkshopClient from "./WorkshopClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WorkshopClient />
    </Suspense>
  );
}