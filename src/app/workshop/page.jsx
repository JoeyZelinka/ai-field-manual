// src/app/workshop/page.jsx
import { Suspense } from "react";
import WorkshopClient from "./WorkshopClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "rgb(18,10,12)" }} />
      }
    >
      <WorkshopClient />
    </Suspense>
  );
}