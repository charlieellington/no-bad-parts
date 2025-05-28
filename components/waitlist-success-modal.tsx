"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";

export default function WaitlistSuccessModal({ message }: { message: string }) {
  const [open] = useState(true); // keep dialog locked open

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-sm text-center"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Almost there!</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
} 