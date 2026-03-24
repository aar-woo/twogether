"use client";

import { useState, useTransition } from "react";
import { dismissWelcomeBanner } from "./actions";

export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    startTransition(() => {
      dismissWelcomeBanner();
    });
  }

  return (
    <div className="mb-6 rounded-lg border border-[#C4714A]/30 bg-[#C4714A]/5 px-5 py-4 flex items-start justify-between gap-4 shadow-sm">
      <p className="text-sm text-foreground leading-relaxed">
        Welcome to Twogether! Set your budget in{" "}
        <a href="/settings" className="underline underline-offset-2 font-medium text-[#C4714A]">
          Settings
        </a>
        , then start planning your wedding together.
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
        aria-label="Dismiss welcome banner"
      >
        Dismiss
      </button>
    </div>
  );
}
