"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecisionWithOptions } from "../../../../../types/index";
import { OptionCard } from "./OptionCard";
import { addOption, resolveDecision } from "./actions";

interface OptionListProps {
  decision: DecisionWithOptions;
  currentUserId: string;
}

export function OptionList({ decision, currentUserId }: OptionListProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [, startTransition] = useTransition();

  const isOpen = decision.status === "open";

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await addOption(decision.id, label);
      if (!result?.error) {
        setNewLabel("");
        setIsAdding(false);
        router.refresh();
      }
    });
  }

  function handleCancel() {
    setNewLabel("");
    setIsAdding(false);
  }

  function handleResolve(optionId: string) {
    startTransition(async () => {
      await resolveDecision(decision.id, optionId);
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/decisions"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All Decisions
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="font-serif text-2xl text-foreground">{decision.title}</h1>
          <span
            className={
              isOpen
                ? "text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0 mt-1"
                : "text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0 mt-1"
            }
          >
            {isOpen ? "Open" : "Resolved"}
          </span>
        </div>
        {decision.category && (
          <span className="text-sm text-muted-foreground">{decision.category}</span>
        )}
      </div>

      {/* Options list */}
      {decision.decision_options.length === 0 && !isAdding ? (
        <p className="text-center py-8 text-muted-foreground">
          No options yet. Add the first one below.
        </p>
      ) : (
        decision.decision_options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            currentUserId={currentUserId}
            decisionId={decision.id}
            decisionStatus={decision.status}
            resolvedOptionId={decision.resolved_option_id}
            onResolve={handleResolve}
          />
        ))
      )}

      {/* Add option section */}
      {isAdding ? (
        <div className="mt-2 flex gap-2 items-center">
          <Input
            placeholder="Option label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <Button size="sm" onClick={handleAdd}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="mt-2 text-muted-foreground"
          onClick={() => setIsAdding(true)}
        >
          + Add option
        </Button>
      )}
    </div>
  );
}
