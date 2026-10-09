"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TombolCetak() {
  return (
    <Button varian="outline" ikon={<Printer />} onClick={() => window.print()}>
      Cetak
    </Button>
  );
}
