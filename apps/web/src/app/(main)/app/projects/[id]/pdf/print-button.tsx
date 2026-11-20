"use client";

import { Button } from "@honeymoney/ui";
import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Download aria-hidden /> Baixar PDF
    </Button>
  );
}
